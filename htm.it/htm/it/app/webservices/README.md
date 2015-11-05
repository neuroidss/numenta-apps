HTM-IT Web API
============


This package contains a WSGI application to interface with HTM-IT. Its entry point is through the webapp module. 


When debugging, it's sometimes handy to use `curl` to send requests to HTM-IT API; this example assumes that HTM-IT is running on localhost and HTM-IT API key is abcdef:
```
curl -k -u abcdef: https://localhost/_metrics/cloudwatch -X GET
```


