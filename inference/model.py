import torch
from instruct_pix2pix.stable_diffusion.ldm.util import instantiate_from_config
from omegaconf import OmegaConf
from PIL import Image, ImageOps
import math
from torch import nn, autocast
import einops
import k_diffusion as K
from typing import Tuple, Any
import numpy as np
from einops import rearrange


def load_model_from_config(config, ckpt, vae_ckpt=None, verbose=False) -> nn.Module:
    print(f"Loading model from {ckpt}")
    pl_sd = torch.load(ckpt, map_location="cpu")
    if "global_step" in pl_sd:
        print(f"Global Step: {pl_sd['global_step']}")
    sd = pl_sd["state_dict"]
    if vae_ckpt is not None:
        print(f"Loading VAE from {vae_ckpt}")
        vae_sd = torch.load(vae_ckpt, map_location="cpu")["state_dict"]
        sd = {
            k: vae_sd[k[len("first_stage_model.") :]]
            if k.startswith("first_stage_model.")
            else v
            for k, v in sd.items()
        }
    model = instantiate_from_config(config.model)
    m, u = model.load_state_dict(sd, strict=False)
    if len(m) > 0 and verbose:
        print("missing keys:")
        print(m)
    if len(u) > 0 and verbose:
        print("unexpected keys:")
        print(u)
    return model


class CFGDenoiser(nn.Module):
    def __init__(self, model):
        super().__init__()
        self.inner_model = model

    def forward(self, z, sigma, cond, uncond, text_cfg_scale, image_cfg_scale):
        cfg_z = einops.repeat(z, "1 ... -> n ...", n=3)
        cfg_sigma = einops.repeat(sigma, "1 ... -> n ...", n=3)
        cfg_cond = {
            "c_crossattn": [
                torch.cat(
                    [
                        cond["c_crossattn"][0],
                        uncond["c_crossattn"][0],
                        uncond["c_crossattn"][0],
                    ]
                )
            ],
            "c_concat": [
                torch.cat(
                    [cond["c_concat"][0], cond["c_concat"][0], uncond["c_concat"][0]]
                )
            ],
        }
        out_cond, out_img_cond, out_uncond = self.inner_model(
            cfg_z, cfg_sigma, cond=cfg_cond
        ).chunk(3)
        return (
            out_uncond
            + text_cfg_scale * (out_cond - out_img_cond)
            + image_cfg_scale * (out_img_cond - out_uncond)
        )


def load_model(config_path: str, ckpt_path: str):
    config = OmegaConf.load(config_path)
    model = load_model_from_config(config, ckpt_path, None)
    model.eval().cuda()
    model_wrap = K.external.CompVisDenoiser(model)
    model_wrap_cfg = CFGDenoiser(model_wrap)
    return (model, model_wrap, model_wrap_cfg)


def inference(
    model: nn.Module,
    model_wrap: Any,
    model_wrap_cfg: CFGDenoiser,
    image: Image,
    edit: str,
    resolution: int = 512,
    steps: int = 100,
    seed=1000,
    cfg_image: int = 1.5,
    cfg_text: int = 7.5,
) -> Image:

    width, height = image.size
    factor = resolution / max(width, height)
    factor = math.ceil(min(width, height) * factor / 64) * 64 / min(width, height)
    width = int((width * factor) // 64) * 64
    height = int((height * factor) // 64) * 64
    input_image = ImageOps.fit(image, (width, height), method=Image.Resampling.LANCZOS)

    null_token = model.get_learned_conditioning([""])

    with torch.no_grad(), autocast("cuda"), model.ema_scope():
        cond = {}
        cond["c_crossattn"] = [model.get_learned_conditioning([edit])]
        input_image = 2 * torch.tensor(np.array(input_image)).float() / 255 - 1
        input_image = rearrange(input_image, "h w c -> 1 c h w").to(model.device)
        cond["c_concat"] = [model.encode_first_stage(input_image).mode()]

        uncond = {}
        uncond["c_crossattn"] = [null_token]
        uncond["c_concat"] = [torch.zeros_like(cond["c_concat"][0])]

        sigmas = model_wrap.get_sigmas(steps)

        extra_args = {
            "cond": cond,
            "uncond": uncond,
            "text_cfg_scale": cfg_text,
            "image_cfg_scale": cfg_image,
        }

        torch.manual_seed(seed)
        z = torch.randn_like(cond["c_concat"][0]) * sigmas[0]
        z = K.sampling.sample_euler_ancestral(
            model_wrap_cfg, z, sigmas, extra_args=extra_args
        )
        x = model.decode_first_stage(z)
        x = torch.clamp((x + 1.0) / 2.0, min=0.0, max=1.0)
        x = 255.0 * rearrange(x, "1 c h w -> h w c")
        edited_image = Image.fromarray(x.type(torch.uint8).cpu().numpy())

    return edited_image
