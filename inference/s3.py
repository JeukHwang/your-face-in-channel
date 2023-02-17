from PIL import Image
from botocore.exceptions import ClientError
import boto3
import os


def upload_file(aws_credentials, file_name, bucket, object_name=None):
    """
    Upload a file to an S3 bucket
    Parameters
    ----------
    file_name: str
        File to upload
    bucket: str
        Bucket to upload to
    object_name: str
        S3 object name. If not specified then file_name is used
    Returns
    -------
    True if file was uploaded, else False
    """

    # If S3 object_name was not specified, use file_name
    if object_name is None:
        object_name = os.path.basename(file_name)

    # Upload the file
    s3_client = boto3.client(
        "s3",
        aws_access_key_id=aws_credentials["access_key_id"],
        aws_secret_access_key=aws_credentials["secret_access_key"],
        region_name=aws_credentials["region_name"],
    )
    try:
        response = s3_client.upload_file(file_name, bucket, object_name)
        return f'https://{bucket}.s3.{aws_credentials["region_name"]}.amazonaws.com/{object_name}'

    except ClientError as e:
        return False
