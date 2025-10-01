# ERROR 271: Python backend in polyglot project
# Mixed language integration issue

from flask import Flask
app = Flask(__name__)

@app.route('/')
def hello():
    return "Python backend"

if __name__ == '__main__':
    app.run()