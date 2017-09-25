'use strict';

const express = require('express');
const simpleOauthModule = require('simple-oauth2');
var jwt = require('jsonwebtoken');

const app = express();

//oauth2/OIDC settings. Note - should keep all parameters in an external, encrypted file (especially secret.)
const oauth2 = simpleOauthModule.create({
  client: {
    id: 'CHANGE-ME',
    secret: 'CHANGE-ME',
  },
  auth: {
    tokenHost: 'https://dev1.maxconnector.com',
    tokenPath: '/dev-axn-aws/axn/oauth2/token',
    authorizePath: '/dev-axn-aws/axn/oauth2/authorize',
  },
});
	
// Authorization uri definition
const authorizationUri = oauth2.authorizationCode.authorizeURL({
  redirect_uri: 'http://localhost:3000/redirect',
  scope: 'idp.google country.US openid',
  state: "12345"
});

// Initial page redirecting to Github
app.get('/auth', (req, res) => {
  console.log(authorizationUri);
  res.redirect(authorizationUri);
});

// Callback service parsing the authorization token and asking for the access token
app.get('/redirect', (req, res) => {
  const code = req.query.code;
  const options = {
    code,
    redirect_uri: 'http://localhost:3000/redirect',
    state: '12345'
  };

  oauth2.authorizationCode.getToken(options, (error, result) => {
    if (error) {
      console.error('Access Token Error', error.message);
      return res.json('verification failed, please contact administrator.');
    }

//the resulting tokens (ID, Access and Refresh)
    const token = oauth2.accessToken.create(result);

    //raw ID token
    console.log('////RAW ID TOKEN: ' + token.token.id_token)

    //decoded ID token
    var decoded = jwt.decode(token.token.id_token, {complete: true});
    console.log('//DECODED ID TOKEN: ' + JSON.stringify(decoded))
    console.log('//DECODED ID TOKEN PAYLOAD: ' + JSON.stringify(decoded.payload))
    //parse contents of token here, eg. identity assertions, risk scores, etc.

    return res
      .status(200)
      .json(decoded);
  });
});

app.get('/success', (req, res) => {
  res.send('');
});

app.get('/', (req, res) => {
  res.send('Hello<br><a href="/auth">Login with Google via ID DataWeb</a>');
});

app.listen(3000, () => {
  console.log('Express server started on port 3000'); 
});