window.onload = function(){
alert("ATTENZIONE: QUESTA E' SOLO UNA DEMO! L'app deve essere utilizzata SOLO a scopo dimostrativo. Un utilizzo reale è PERICOLOSO E DEVE ESSERE EVITATO!")
const video = document.getElementById("camera");
const canvas = document.getElementById("videoCanvas");
const canvas_ctx = canvas.getContext('2d');
const sem_canvas = document.getElementById("sem_canvas");
const sem_canvas_ctx = sem_canvas.getContext('2d');
const sem_avg_el = document.getElementById("SEM_AVG");
const points_avg_el = document.getElementById("POINTS_AVG");

const yellow_sound = new Audio('./static/js/audio/giallo.mp3');
const red_sound = new Audio('./static/js/audio/rosso.mp3');
const forward_sound = new Audio('./static/js/audio/dritto.mp3');
const dx_sound = new Audio('./static/js/audio/destra.mp3');
const sx_sound = new Audio('./static/js/audio/sinistra.mp3');
const classes = ['red', 'green', 'countdown_green', 'countdown_blank', 'none'];

document.getElementById("decreaseSem").addEventListener('click', decreaseValueSem);
document.getElementById("increaseSem").addEventListener('click', increaseValueSem);
document.getElementById("decreasePoints").addEventListener('click', decreaseValuePoints);
document.getElementById("increasePoints").addEventListener('click', increaseValuePoints);

var SEM_AVG = parseInt(sem_avg_el.value, 10);
var POINTS_AVG = parseInt(points_avg_el.value, 10);

var points_buff = zeros(POINTS_AVG, 4);
var points = [0, 0, 0, 0];
var sem_rec = [0, 0, 0, 0, 0];
var sem = 0;
var sem_iter = SEM_AVG-1;
var points_iter = 0;

canvas.width = 768;
canvas.height = 576;
sem_canvas.width = 768;
sem_canvas.height = sem_canvas.width/5;

video.onplay = function() {
  setTimeout(updateRequest, 300);
 
  sem_canvas.width = video.offsetWidth;
  sem_canvas.height = sem_canvas.width/5;
};

window.addEventListener('resize', function(event){
  canvas.width = video.offsetWidth;
  canvas.height = video.offsetHeight;
  sem_canvas.width = video.offsetWidth;
  sem_canvas.height = sem_canvas.width/5;
  sem_canvas_ctx.fillStyle = "#666666";
  sem_canvas_ctx.beginPath();
  sem_canvas_ctx.arc(sem_canvas.width*3/4, sem_canvas.height/2, sem_canvas.height/2.5, 0, 2 * Math.PI);
  sem_canvas_ctx.arc(sem_canvas.width/2, sem_canvas.height/2, sem_canvas.height/2.5, 0, 2 * Math.PI);
  sem_canvas_ctx.arc(sem_canvas.width/4, sem_canvas.height/2, sem_canvas.height/2.5, 0, 2 * Math.PI);
  sem_canvas_ctx.fill();
});

function updateDirection() {
  canvas.width = video.offsetWidth;
  canvas.height = video.offsetHeight;
  canvas_ctx.strokeStyle = "#FF0000";
  canvas_ctx.lineWidth = 5;
  canvas_ctx.beginPath();
  canvas_ctx.moveTo(points[0]*canvas.width, points[1]*canvas.height);
  canvas_ctx.lineTo(points[2]*canvas.width, points[3]*canvas.height);
  canvas_ctx.stroke();
  
  if(points[0] < 0.42){
  	sx_sound.play();
  }else if(points[0] > 0.58){
  	dx_sound.play();
  }else{
  	forward_sound.play();
  }
}

function updateSemaphore() {
  sem_canvas_ctx.fillStyle = "#666666";
  sem_canvas_ctx.beginPath();
  sem_canvas_ctx.arc(sem_canvas.width*3/4, sem_canvas.height/2, sem_canvas.height/2.5, 0, 2 * Math.PI);
  sem_canvas_ctx.arc(sem_canvas.width/2, sem_canvas.height/2, sem_canvas.height/2.5, 0, 2 * Math.PI);
  sem_canvas_ctx.arc(sem_canvas.width/4, sem_canvas.height/2, sem_canvas.height/2.5, 0, 2 * Math.PI);
  sem_canvas_ctx.fill();
  
  if(sem == 0) {
  	// red
  	sem_canvas_ctx.fillStyle = "#ff0000";
  	sem_canvas_ctx.beginPath();
  	sem_canvas_ctx.arc(sem_canvas.width*3/4, sem_canvas.height/2, sem_canvas.height/2.5, 0, 2 * Math.PI);
  	sem_canvas_ctx.fill();
  } else if(sem == 2 || sem == 3) { 
  	// yellow
  	sem_canvas_ctx.fillStyle = "#ffff00";
  	sem_canvas_ctx.beginPath();
 	sem_canvas_ctx.arc(sem_canvas.width/2, sem_canvas.height/2, sem_canvas.height/2.5, 0, 2 * Math.PI);
  	sem_canvas_ctx.fill();
  } else if(sem == 1) { 
  	// green
  	sem_canvas_ctx.fillStyle = "#00ff00";
  	sem_canvas_ctx.beginPath();
  	sem_canvas_ctx.arc(sem_canvas.width/4, sem_canvas.height/2, sem_canvas.height/2.5, 0, 2 * Math.PI);
  	sem_canvas_ctx.fill();
  }
  console.log(sem_rec);
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
       sem_rec[data['class']] += 1;
       if(sem_iter < SEM_AVG-1){
         sem_iter++;
       }
       else
       {
         sem_iter = 0;
  		 sem = sem_rec.reduce((iMax, x, i, arr) => x > arr[iMax] ? i : iMax, 0);
  		 updateSemaphore();
  		 sem_rec = [0, 0, 0, 0, 0];
       }
       
       points_buff[points_iter] = data['points'];
       if(points_iter < POINTS_AVG-1){
         points_iter++;
       }
       else
       {
         points_iter = 0;
         points = [0, 0, 0, 0];
         var i;
		 for (i = 0; i < POINTS_AVG; i++) {
  		    points[0] += points_buff[i][0];
  		    points[1] += points_buff[i][1];
  		    points[2] += points_buff[i][2];
  		    points[3] += points_buff[i][3];
		 }
		 points[0] /= POINTS_AVG;
  		 points[1] /= POINTS_AVG;
  		 points[2] /= POINTS_AVG;
  		 points[3] /= POINTS_AVG;
  		 /*
  		 if(sem == 0){
  		 	red_sound.play();
  		 }
  		 else if(sem == 3){
         	yellow_sound.play();
         	updateDirection();
         }
         else {
         	updateDirection();
         }
         */
         if(sem == 0){
  		 	red_sound.play();
  		 }
  		 else if(sem == 2 || sem == 3){
         	yellow_sound.play();
         }
         updateDirection();
       }
       
       updateRequest();
    }
  })
}

function increaseValueSem() {
  var value = parseInt(sem_avg_el.value, 10);
  value = isNaN(value) ? 0 : value;
  value++;
  value > 20 ? value = 20 : '';
  sem_avg_el.value = value;
  sem_iter = 0;
  sem_rec = [0, 0, 0, 0, 0];
  SEM_AVG = value;
}

function decreaseValueSem() {
  var value = parseInt(sem_avg_el.value, 10);
  value = isNaN(value) ? 0 : value;
  value--;
  value < 1 ? value = 1 : '';
  sem_avg_el.value = value;
  sem_iter = 0;
  sem_rec = [0, 0, 0, 0, 0];
  SEM_AVG = value;
}

function increaseValuePoints() {
  var value = parseInt(points_avg_el.value, 10);
  value = isNaN(value) ? 0 : value;
  value++;
  value > 20 ? value = 20 : '';
  points_avg_el.value = value;
  points_iter = 0;
  points_buff = zeros(value, 4);
  POINTS_AVG = value;
}

function decreaseValuePoints() {
  var value = parseInt(points_avg_el.value, 10);
  value = isNaN(value) ? 0 : value;
  value--;
  value < 1 ? value = 1 : '';
  points_avg_el.value = value;
  points_iter = 0;
  points_buff = zeros(value, 4);
  POINTS_AVG = value;
}

function zeros(dimensions) {
    var array = [];

    for (var i = 0; i < dimensions[0]; ++i) {
        array.push(dimensions.length == 1 ? 0 : zeros(dimensions.slice(1)));
    }

    return array;
}

const constraints = {
  audio: false,

  video: {
    facingMode: {
      exact: 'environment'
    }
  }

  //video: true
};

function handleSuccess(stream) {
  window.stream = stream;
  video.srcObject = stream;
}

function handleError(error) {
  console.log('navigator.MediaDevices.getUserMedia error: ', error.message, error.name);
}

navigator.mediaDevices.getUserMedia(constraints).then(handleSuccess).catch(handleError);
}
