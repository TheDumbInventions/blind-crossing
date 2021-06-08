import torch
from LYTNetV2 import LYTNetV2
import numpy as np
from PIL import Image
import io
from flask import Flask,request,jsonify,render_template
import os

model=LYTNetV2()
model.load_state_dict(torch.load('model.pt', map_location=torch.device('cpu')))
model.eval()

classes = {'0':'red', '1':'green', '2':'countdown_green', '3':'countdown_blank', '4':'none'}

app = Flask(__name__, static_url_path='/static')

@app.route('/')
def render_page():
	return render_template('index.html')

@app.route('/predict',methods=['POST'])
def predict():
	file = request.files['file']
	image_bytes = file.read()
	im = Image.open(io.BytesIO(image_bytes))
	#im=im.rotate(-90, expand=False)
	w, h = 768, 576
	im = im.resize((w, h))
	
	pix = np.array(np.transpose(im, (2, 0, 1)))
	pix = torch.Tensor(pix).type(torch.FloatTensor)
	pix = pix.unsqueeze(0)
	pix = pix.view([1,-1,h,w])

	pred_classes, pred_direc = model(pix)
	_, predicted = torch.max(pred_classes, 1)

	predicted_id = str(predicted.cpu().numpy()[0])
	points = pred_direc.cpu().detach().numpy()[0].tolist()
	
	return jsonify(f"{classes[predicted_id]}  {points}")
    
if __name__ == '__main__':
    app.run(debug=False,port=os.getenv('PORT',5000))
