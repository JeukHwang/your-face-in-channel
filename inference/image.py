from PIL import Image
from io import BytesIO


def read_image(file) -> Image.Image:
    pil_image = Image.open(BytesIO(file))
    # print('print dentro da funcao --- ok ')
    return pil_image.convert("RGB")
