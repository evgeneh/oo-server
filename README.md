# oo-server
server side for oo-social network

## /Wall

###GET
request
```http
GET /api/wall?id=123
```
response
```javascript
{
"resultCode":0,
"data":{
  "userId":number,
  "totalCount":number,
  "posts":[
    {
      "postId": number,
      "date": date,
      "text": string,
      "owner": {
        "userId": number,
        "photo": string,
        "fullName":string
        }
    }
  ]
}
```
