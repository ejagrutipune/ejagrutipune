#uv pip install opencv-python 
print("Hello World")
import cv2
import numpy as np

#code snippet1
#vid_cap=cv2.VideoCapture(0) #0 is the index first preference to inbuilt camera
# #to cpature video usng BGR color format
# while True:
#   ret_bool,frame=vid_cap.read() # ret_bool is a boolean value which indicates status of camera
#   cv2.imshow("webcam",frame)
#   if cv2.waitKey(1) & 0xFF == ord('x'):
#     break

#code snippet2
##to capture video in black and white
#vid_cap=cv2.VideoCapture(0)
# while True:
#   ret_bool,frame=vid_cap.read() # ret_bool is a boolean value which indicates status of camera
#   img_gray=cv2.cvtColor(frame,cv2.COLOR_BGR2GRAY) #converting the color of the frame to gray
#   cv2.imshow("webcam",img_gray)
#   if cv2.waitKey(1) & 0xFF == ord('x'):
#     break
# cv2.destroyAllWindows()

##code snippet3
##to capture video in black and white and save it to a file
vid_cap=cv2.VideoCapture(0)
fourcc=cv2.VideoWriter_fourcc(*'XVID') #to specify the codec for video writing
out=cv2.VideoWriter('./output.avi',fourcc,20.0,(640,480)) #to specify the output file name, codec, frame rate and frame size
while True:        
 ret_bool,frame=vid_cap.read() # ret_bool is a boolean value which indicates status of camera
 out.write(frame) #to write the frame to the output file       
 cv2.imshow("webcam",frame)
 if cv2.waitKey(1) & 0xFF == ord('x'):
   break 