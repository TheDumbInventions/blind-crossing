window.onload = function(){ 
const video = document.getElementById("camera"); //$("#camera");
const canvas = window.canvas = document.getElementById("videoCanvas"); //$("#result");
const canvas_ctx = canvas.getContext('2d');
const result = document.getElementById("result"); //$("#result");

const classes = ['red', 'green', 'countdown_green', 'countdown_blank', 'none'];

canvas.width = 768;
canvas.height = 576;

video.onplay = function() {
  setTimeout(updateRequest, 300);
};

function updateDirection(points) {
  //canvas.width = video.videoWidth;
  //canvas.height = video.videoHeight;
  canvas.width = video.offsetWidth;
  canvas.height = video.offsetHeight;
  //canvas_ctx.drawImage(tmpcanvas, 0, 0, canvas.width, canvas.height);
  canvas_ctx.strokeStyle = "#FF0000";
  canvas_ctx.lineWidth = 5;
  canvas_ctx.beginPath();
  canvas_ctx.moveTo(points[0]*canvas.width, points[1]*canvas.height);
  canvas_ctx.lineTo(points[2]*canvas.width, points[3]*canvas.height);
  canvas_ctx.stroke();
  setTimeout(updateRequest , 50);
}

function updateRequest() {
  //event.preventDefault();
  var tmpcanvas = document.createElement('canvas');
  tmpcanvas.width = video.videoWidth;
  tmpcanvas.height = video.videoHeight;
  tmpcanvas.getContext('2d').drawImage(video, 0, 0, tmpcanvas.width, tmpcanvas.height);
  var image = tmpcanvas.toDataURL('image/jpeg');
  $.ajax({
    type: 'POST',
    url: '/predict',
    data: JSON.stringify({"image": image}),
    dataType: "json",
    contentType: "application/json",
    cache: false,
    processData: false,
    success: function(data) {
       updateDirection(data['points']);
       result.textContent = classes[data['class']];
       console.log(data['class']);
    }
  })
}

const constraints = {
  audio: false,
  video: {
    facingMode: {
      exact: 'environment'
    }
  }
};

function handleSuccess(stream) {
  window.stream = stream; // make stream available to browser console
  video.srcObject = stream;
}

function handleError(error) {
  console.log('navigator.MediaDevices.getUserMedia error: ', error.message, error.name);
}

navigator.mediaDevices.getUserMedia(constraints).then(handleSuccess).catch(handleError);
}
