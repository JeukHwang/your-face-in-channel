from PIL import Image
from io import BytesIO
from autocrop import Cropper
import numpy as np

def read_image(file) -> Image.Image:
    pil_image = Image.open(BytesIO(file))
    # print('print dentro da funcao --- ok ')
    return pil_image.convert("RGB")

def crop_image(cropper: Cropper, image: Image.Image) -> Image.Image:
    image_array = np.array(image)
    print(image_array.shape)
    cropped_array = cropper.crop(image_array)
    
    # Save the cropped image with PIL if a face was detected:
    if cropped_array is not None:
        cropped_image = Image.fromarray(cropped_array)
        return cropped_image
    else:
        return image
