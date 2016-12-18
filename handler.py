from __future__ import print_function

import boto3
import cgi
from StringIO import StringIO
from cgi import FieldStorage
import mimetypes

def upload_drawings(event, context):
    s3 = boto3.resource('s3')

    file_contents = event['body'].decode('base64')

    field_storage = FieldStorage(
        fp=StringIO(file_contents),
        headers={'content-type': event['headers']['Content-Type']},
        environ={'REQUEST_METHOD': 'POST'}
    )

    for file in field_storage['files']:
        mimetype = mimetypes.guess_type(file.filename)
        print(mimetype)
        print(file.filename)
        args = {
            "Key": 'drawings/' + file.filename,
            "Body": file.file.read(),
        }

        if mimetype and mimetype[0]:
            args['ContentType'] = mimetype[0]

        s3.Bucket('bryanpedlar.com').put_object(
            **args
        )

    response = {
        "statusCode": 200,
        "body": "ok!"
    }

    return response
