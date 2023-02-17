import os
from dotenv import load_dotenv
from typing import TypedDict

load_dotenv()


class DotEnv(TypedDict):
    MOCK: bool

    IMAGE_STORAGE_ACCESS_KEY: str
    IMAGE_STORAGE_ACCESS_SECRET_KEY: str
    IMAGE_STORAGE_REGION: str
    IMAGE_STORAGE_BUCKET_NAME: str

    CONTROLLER_URL: str


settings: DotEnv = {
    "MOCK": False if os.getenv("MOCK") == "FALSE" else True,
    "IMAGE_STORAGE_ACCESS_KEY": os.getenv("IMAGE_STORAGE_ACCESS_KEY"),
    "IMAGE_STORAGE_ACCESS_SECRET_KEY": os.getenv("IMAGE_STORAGE_ACCESS_SECRET_KEY"),
    "IMAGE_STORAGE_BUCKET_NAME": os.getenv("IMAGE_STORAGE_BUCKET_NAME"),
    "IMAGE_STORAGE_REGION": os.getenv("IMAGE_STORAGE_REGION"),
    "CONTROLLER_URL": os.getenv("CONTROLLER_URL"),
}
