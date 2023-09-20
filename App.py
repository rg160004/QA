import os
import openai
import tempfile
import pywhisper
from flask import Flask, request, render_template
from werkzeug.utils import secure_filename
import tempfile
import pydub
from pydub import AudioSegment
from flask import Flask, render_template, request
from pydub import AudioSegment
import ffmpeg
from flask import jsonify
import subprocess
from flask_sslify import SSLify
from flask_cors import CORS
# from flask_ngrok import run_with_ngrok
openai.organization = "API to your AI Engine"
openai.api_key = "Private-Key"

# run_with_ngrok(app)
model = pywhisper.load_model("base") 

app = Flask(__name__)
CORS(app)
sslify = SSLify(app)
app.config['UPLOAD_FOLDER'] = './'
app.config['ALLOWED_EXTENSIONS'] = {'wav', 'mp3'}
@app.route('/test')
def test():
  return "working"
@app.route('/')
def index():
    return render_template('index2.html', data="")
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']


def convert_webm_to_mp3(webm_path, mp3_path):
    command = [
        "ffmpeg",
        "-i", webm_path,
        "-vn",
        "-acodec", "libmp3lame",
        "-y", mp3_path
    ]
    subprocess.run(command, check=True)

    @app.route('/upload', methods=['POST'])
def upload():
    print("In upload ")
    if 'audio' not in request.files:
        return "No selected audio file", 400 
    audio_file=request.files['audio']
    if ".mp3" in audio_file.filename:
        audio_path = os.path.join(os.getcwd(), "recorded_audio.mp3")
        audio_file.save(audio_path)
    else:
        audio_path = os.path.join(os.getcwd(), audio_file.filename)
        audio_file.save(audio_path)
    result = model.transcribe("recorded_audio.mp3")
    prompt=request.form["prompt"]
    question=request.form["question"]
    answer=request.form["answer"]
    final=prompt+" "+question+" "+answer+" "+result['text']
    print(final)
    completion = openai.ChatCompletion.create(
    model="Model Of Choice",
    messages=[
        {"role": "user", "content": final}


      ]
    )
    print("done")
    print(completion.choices[0].message["content"])
    # return render_template("index.html", data=final+"\n\n"+completion.choices[0].message["content"] )
    return jsonify({"data":final+"\n\n"+completion.choices[0].message["content"]} )
    # else:  
    #     return "Invalid file type. Only WAV and MP3 files are allowed", 400

if __name__ == '__main__':
    app.run(host='0.0.0.0',port=5001,debug=True)