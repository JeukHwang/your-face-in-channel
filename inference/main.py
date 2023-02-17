import io
import os
import base64
from uuid import uuid4
import sys

sys.path.append("./instruct_pix2pix/stable_diffusion")

import threading
import requests
import time
from queue import Queue

from typing import List
from PIL import Image

from fastapi import FastAPI, UploadFile, File, Response
from fastapi.responses import JSONResponse

# from instruct_pix2pix.edit_app import generate
from omegaconf import OmegaConf
from model import load_model, inference
from env import settings
from generate import read_image
from s3 import upload_file


app = FastAPI()
waiting_queue = Queue(-1)  # queue is infinite
runtime_record: List[int] = []


def calculate_runtime() -> int:
    if len(runtime_record) == 0:
        wait_time = 10
    else:
        wait_time = sum(runtime_record) / len(runtime_record)

    return wait_time


def inference_worker():
    while True:
        print("queue start")
        image = waiting_queue.get()
        print(image)
        start = time.time()
        generate_emoji(image)
        end = time.time()
        runtime_record.append(end - start)
        waiting_queue.task_done()
        print("queue done, next item!")


@app.on_event("startup")
async def startup_event():
    threading.Thread(target=inference_worker, daemon=True).start()


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


def generate_emoji(image: Image):
    if settings["MOCK"]:
        inference_results = [(image, "sample.png")]
        image_id = []
    else:
        # TODO - generate image with instruct pix2pix
        edits = [
            "make him angry",
            "make him clown",
        ]
        inference_results = [
            (
                inference(
                    model,
                    model_wrap,
                    model_wrap_cfg,
                    image,
                    edit,
                ),
                str(uuid4()),
            )
            for edit in edits
        ]

    image_paths = []
    for (image, image_id) in inference_results:
        image_path = os.path.join("images", f"{image_id}.png")
        image.save(image_path)
        image_paths.append(image_path)
    # TODO - generate lot of images

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

    try:
        requests.post(
            f'{settings["CONTROLLER_URL"]}/notification', data={"items": url_list}
        )
    except Exception as e:
        print(e)  # TODO - log error


@app.post("/generate")
async def inferece(file: bytes = File(...)):
    image = read_image(file)
    waiting_queue.put(image)

    return {
        "wait": waiting_queue.qsize(),
        "time": calculate_runtime(),
    }
