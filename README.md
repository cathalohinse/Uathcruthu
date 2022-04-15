# Uathcruthú
Final Year Project: A web app that automates the processing of project submission data into an administrative file.
<br>[Uathcruthú](https://uathcruthu.herokuapp.com/) is a web application that was written up as a final year project for
the WIT Higher Diploma in Science in Computer Science. It is used to automate the processing of project submission data
from the student, into a showcase handbook which is used as a guide by a panel of reviewers at the project presentations.
This application is used by both students and administrators: The student submits their data using the webform contained
therein, and the administrator then creates the handbook based on this data, and their own additional input.
<br>In summary, this application serves as a means for a student to submit their data, and for the administrator to then generate a showcase handbook.
<br>This application is written in node.js on the hapi framework.

### Implementation
#### Additional Accounts required
* Cloudinary
* mongoDB


#### Environmental Variables
The '.env' file needs to be populated as follows:
```
cookie_name= "Cookie"  
cookie_password= "Cookie Password"  
db= "mongoDB Connection String"  
name= "Cloudinary Cloud Name"  
key= "Cloudinary API Key"  
secret= "Cloudinary API Secret"
```


#### Deployment
If deploying to Heroku, there is currently one function (The 'Create Handbook' function in the 'admin' view) that takes longer than 30 seconds to process, which due to Heroku's configuration will cause the UI to timeout. However, the application will continue to run in the background, so the resulting pdf can still be accessed once it is created. The [directory](https://uathcruthu.herokuapp.com/handbooks/) is public, so progress can be monitored there. Note: future releases of this application will have a 'delayed job' that will send intermittent requests to the server to prevent the Heroku time out.


#### User Access
There is a sign-up feature that is currently hidden from view. This can be enabled in the 'welcome-menu.hbs' partial. Alternatively, users of type 'User' and 'Admin' can be seeded in the 'seed-data.json' file. All that is required is a first name, a last name and an email address, so a list of users can be seeded, and each individual user can then enter their own discretionary password when they first log in, but unfortunately there is currently no prompt for first time users when entering their password (requirements etc.) and there is no password confirmation. This will all be rectified in future releases.



### Technologies
* node.js
* hapi
* handlebars
* WebStorm
* mongoDB
  * Studio 3T Free
* Cloudinary
* Joi
* Bcrypt
* sanitize-html
* jsPDF
* pdf-merger-js
* image-data-uri
* SourceTree
* git
* GitHub
  * GitHub Pages
* Heroku
* YouTube
* Screencast-O-Matic
* bitly
* Trello
* Draw.io
    



### Links
* [Uathcruthú](https://uathcruthu.herokuapp.com/)
    * [Directory Listing](https://uathcruthu.herokuapp.com/handbooks/)
* [Demonstration Video](https://youtu.be/Nly0TXLTJAA)
* [GitHub Repository](https://github.com/cathalohinse/Uathcruthu)
* [Trello Board](https://trello.com/b/3GvQzJVK/uathcruth%C3%BA)
* [Landing Page](https://cathalohinse.github.io/Uathcruthu/)

<br>

![WIT Crest](./public/images/ITPL.png)
