There's a handy python package `iconGen` specifically designed to generate these icons.

Please use `python 3.5+`

- `$ pip install iconGen`

If you already have a square image (width == height), and you want to use the entire image

- `$ iconGen --full /path/to/img.jpg`

- rename the generated folder of images to `"icons"`

Otherwise you can crop the image with the following command. A GUI will pop up. Follow command line prompts.

- `$ iconGen /path/to/img.jpg`

- rename the generated folder of images to `"icons"`

