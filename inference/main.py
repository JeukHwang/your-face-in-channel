import io
import os
import base64
from uuid import uuid4
import sys
import json

sys.path.append("./instruct_pix2pix/stable_diffusion")

import threading
import requests
import time
from queue import Queue

from typing import List
from PIL import Image

from fastapi import FastAPI, File, Form
from fastapi.responses import JSONResponse

# from instruct_pix2pix.edit_app import generate
from omegaconf import OmegaConf
from model import load_model, inference
from env import settings
from image import read_image
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
        (image, name) = waiting_queue.get()
        start = time.time()
        generate_emoji(image, name)
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


def generate_emoji(image: Image, name: str):
    if settings["MOCK"]:
        inference_results = [{
            "inside": image,
            "cover": image,
        }]
        edits = [{
            "prompt": "mock message",
            "prefix": "mock"
        }]
    else:
        edits = [
            {
                "prompt": "make him angry",
                "prefix": "angry",
            },
            {
                "prompt": "make him clown",
                "prefix": "clown",
            },
        ]
        inference_results = [
            inference(
                model,
                model_wrap,
                model_wrap_cfg,
                image,
                edit["prompt"],
            )
            for edit in edits
        ]

    image_paths = []
    for images in inference_results:
        image_id = str(uuid4())

        image_path = {
            "inside": os.path.join("images", f"{image_id}_inside.png"),
            "cover": os.path.join("images", f"{image_id}_cover.png"),
        }
        for image_type in ["inside", "cover"]:
            images[image_type].save(image_path[image_type])
        image_paths.append(image_path)

    items = []
    for (image_path, edit) in zip(image_paths, edits):
        # TODO - refactor
        row = {}
        for image_type, bucket_folder in zip(
            ["inside", "cover"], ["720x718,inside,webp", "72x,cover,webp"]
        ):
            url = upload_file(
                aws_credentials={
                    "access_key_id": settings["IMAGE_STORAGE_ACCESS_KEY"],
                    "secret_access_key": settings["IMAGE_STORAGE_ACCESS_SECRET_KEY"],
                    "region_name": settings["IMAGE_STORAGE_REGION"],
                },
                file_name=image_path[image_type],
                bucket=settings["IMAGE_STORAGE_BUCKET_NAME"],
                object_name=os.path.join("thumb", bucket_folder, image_id),
            )
            row[image_type] = url
            row["emoji_key"] = f"{edit['prefix']}_{name}"

        items.append(row)

    try:
        url = f'{settings["CONTROLLER_URL"]}/emoji/notification'
        requests.post(
            url, json={"items": items}
        )
    except Exception as e:
        print(e)  # TODO - log error


@app.post("/generate")
async def inferece(file: bytes = File(...), name: str = Form()):
    image = read_image(file)
    waiting_queue.put((image, name))

    return {
        "wait": waiting_queue.qsize(),
        "time": calculate_runtime(),
    }
