### What we provide to the customer

1. `ACS URL`: The URL that their SAML identity provider will POST a SAML response to.
   This URL must point to this API, including the path. This URL is equal to `apiURL` in `config.yaml`, but incremented by 1 port.
   For example, if a customer's `apiUrl` is `http:petronas-dra:8080`, then we must provide to them `ACS URL = http:petronas-dra:8081/api/SAML`, where `/api/SAML` is the Express route we've configured to consume the SAML response.
   In development, if `apiURL` is `http://locahost:3000`, then the `ACS URL` used for testing must be `http://locahost:3001/api/SAML` since the server will start on port 3001 automatically.

### What the customer providers to us

1. `SAML.pem`: This is a certificate file that this API will use to validate the login attempts POSTed to `/api/SAML`. It should be of extension type `.pem` and we'll rename it to `SAML.pem` since that's an implementation detail. This file should live at the same level as our current `config.yaml`.
2. `idpURL`: The URL that DRA should redirect the user to log in. This URL points to whatever identity provider they are using. After setting up a new SAML integration on their side, they obtain the `idpURL` and we put it into our `config.yaml`:

```
...

SAML:
  idpUrl: https://accounts.google.com/o/saml2/initsso?idpid=C02oo214k&spid=85882158824&forceauthn=false

...
```

3. `firstNameKey`, `lastNameKey`, `emailKey`: These are 3 required properties that will be configured in `config.yaml`. They tell our Express route the shape of the user's data in the SAML response so we can be confident that the data exists.
   In testing with Google SAML, the response they sent was:

```
{
  "first": "dummy",
  "last": "dummy",
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier": "myemail@nearmissmgmt.com"
}
```

Where `firstNameKey=first`, `lastNameKey=last`, `emailKey=http://schem...`.

Insert these values into `config.yaml`:

```
...

SAML:
  idpUrl: https://accounts.google.com/o/saml2/initsso?idpid=C02oo214k&spid=85882158824&forceauthn=false
  firstNameKey: first
  lastNameKey: last
  emailKey: http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier

...
```

### How to test

1. Configure the above steps and start this API so that it picks up on the changes.
2. Refresh the frontend so that it too sees the new `config.yaml`. You should no longer see a login form as a result.
3. Ensure that clicking the login button redirects you to the `idpURL`.
4. Complete the login process, which should bring you to the DRA home page if successful.
5. Keep this API's logs open to see potential errors.

If the auth flow is not working because `firstNameKey`, `lastNameKey`, or `emailKey` are incorrect, you should see related logs as well as the actual shape of the data after trying to log in. Update the `config.yaml` with the correct values and try again.
