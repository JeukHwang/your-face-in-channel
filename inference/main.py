import io
import os
import base64
from uuid import uuid4
import sys

sys.path.append("./instruct_pix2pix/stable_diffusion")

from fastapi import FastAPI, UploadFile, File, Response
from fastapi.responses import JSONResponse

# from instruct_pix2pix.edit_app import generate
from omegaconf import OmegaConf
from model import load_model, inference
from env import settings
from generate import read_image
from s3 import upload_file

app = FastAPI()


def from_image_to_bytes(img):
    """
    pillow image 객체를 bytes로 변환
    """
    # Pillow 이미지 객체를 Bytes로 변환
    imgByteArr = io.BytesIO()
    img.save(imgByteArr, format=img.format)
    imgByteArr = imgByteArr.getvalue()
    # Base64로 Bytes를 인코딩
    encoded = base64.b64encode(imgByteArr)
    # Base64로 ascii로 디코딩
    decoded = encoded.decode("ascii")
    return decoded


if not settings["MOCK"]:
    config = OmegaConf.load("instruct_pix2pix/environment.yaml")
    (model, model_wrap, model_wrap_cfg) = load_model(
        "instruct_pix2pix/configs/generate.yaml",
        ckpt_path="instruct_pix2pix/checkpoints/instruct-pix2pix-00-22000.ckpt",
    )


@app.get("/")
async def root():
    return {"message": "lol"}


@app.post("/generate")
async def inferece(file: bytes = File(...)):
    image = read_image(file)

    if settings["MOCK"]:
        inference_result = image
        image_id = "sample.png"
    else:
        # TODO - generate image with instruct pix2pix
        inference_result = inference(
            model, model_wrap, model_wrap_cfg, image, "make him angry"
        )
        image_id = str(uuid4())

    image_path = os.path.join("images", f"{image_id}.png")
    inference_result.save(image_path)

    # TODO - generate lot of images
    image_paths = [image_path]
    url_list = []

    for image_path in image_paths:
        cover_url = upload_file(
            aws_credentials={
                "access_key_id": settings["IMAGE_STORAGE_ACCESS_KEY"],
                "secret_access_key": settings["IMAGE_STORAGE_ACCESS_SECRET_KEY"],
                "region_name": settings["IMAGE_STORAGE_REGION"],
            },
            file_name=image_path,
            bucket=settings["IMAGE_STORAGE_BUCKET_NAME"],
            object_name=os.path.join("thumb", "72x,cover,webp", image_id),
        )
        inside_url = upload_file(
            aws_credentials={
                "access_key_id": settings["IMAGE_STORAGE_ACCESS_KEY"],
                "secret_access_key": settings["IMAGE_STORAGE_ACCESS_SECRET_KEY"],
                "region_name": settings["IMAGE_STORAGE_REGION"],
            },
            file_name=image_path,
            bucket=settings["IMAGE_STORAGE_BUCKET_NAME"],
            object_name=os.path.join("thumb", "720x718,inside,webp", image_id),
        )

        url_list.append(
            {
                "cover": cover_url,
                "inside": inside_url,
            }
        )

    return {"items": url_list}
