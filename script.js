
function validateIdToken(idToken) {
  console.log("Validating ID Token...");
  
  // Initialize Cognito userpool client
  const poolData = {
    UserPoolId: "us-east-1_KbsERc55E",
    ClientId: "29uilsdqn86ki39ti4fhjqfdvm",
  };
  const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);

  // Decode the ID token
  const payload = jwtDecode(idToken);
  console.log("Decoded JWT payload:", payload);

  // Check if the token has expired
  const now = Date.now() / 1000;
  if (payload.exp < now) {
    console.log("ID token has expired");
    return Promise.reject("ID token has expired");
  }

  // Get the user data from Cognito user pool
  const cognitoUser = new AmazonCognitoIdentity.CognitoUser({
    Username: payload.username,
    Pool: userPool,
  });
  console.log("Cognito user:", cognitoUser);

  return new Promise((resolve, reject) => {
    // Verify the signature of the ID token
    const jwksClient = jwksRsa({
      jwksUri: `https://cognito-idp.us-east-1.amazonaws.com/us-east-1_KbsERc55E/.well-known/jwks.json`,
    });
    function getKey(header, callback) {
      jwksClient.getSigningKey(header.kid, (err, key) => {
        if (err) {
          console.log("Error getting signing key:", err);
          callback(err);
        } else {
          console.log("Signing key:", key.publicKey || key.rsaPublicKey);
          callback(null, key.publicKey || key.rsaPublicKey);
        }
      });
    }

    jwt.verify(
      idToken,
      getKey,
      {
        audience: "29uilsdqn86ki39ti4fhjqfdvm",
        issuer: `https://cognito-idp.us-east-1.amazonaws.com/us-east-1_KbsERc55E`,
        algorithms: ["RS256"],
      },
      (err, decoded) => {
        if (err) {
          console.log("Error verifying ID token:", err);
          reject(err);
        } else {
          console.log("Decoded ID token:", decoded);

          // Check if the user is valid
          if (decoded.token_use !== "id") {
            console.log("Invalid token_use");
            reject("Invalid token_use");
          } else if (decoded.client_id !== "29uilsdqn86ki39ti4fhjqfdvm") {
            console.log("Invalid client_id");
            reject("Invalid client_id");
          } else {
            console.log("ID token is valid");
            resolve(decoded);
          }
        }
      }
    );
  });
}


document.addEventListener("DOMContentLoaded", function () {
  // Get references to the relevant elements
  const layerValuesSelect = document.querySelector("#layer-values-dropdown");
  const layerVersionSelect = document.querySelector("#layer-version-dropdown");
  const submitBtn = document.querySelector("button[type='submit']");
  const refereshBtn = document.querySelector("button[type='submit']");
  const comingSoonLabel = document.querySelector("#coming-soon-label");

  const urlParams = window.location.hash.split("&");
  const idTokenParam = urlParams.find(param => param.includes("id_token="));
  const idToken = idTokenParam ? idTokenParam.split("=")[1] : null;
  console.log(idToken)
  if (idToken) {
    try {
      const claims = validateIdToken(idToken);
      console.log("Token validated successfully. Claims:", claims);
      // Do something with the claims
    } catch (err) {
      console.error("Error validating token:", err);
      // Handle error
    }
  }

  // Hide the second dropdown, third dropdown, and submit button by default
  layerValuesSelect.style.display = "none";
  layerVersionSelect.style.display = "none";
  submitBtn.style.display = "none";

  // Add an event listener to the first dropdown
  const configTypeSelect = document.querySelector("#config-type");
  configTypeSelect.addEventListener("change", async function () {
    if (configTypeSelect.value === "Layers") {
      // If "Layers" is selected, show the second dropdown and hide the "coming soon" label
      layerValuesSelect.style.display = "block";
      layerVersionSelect.style.display = "block";
      comingSoonLabel.style.display = "none";
      submitBtn.style.display = "block";

      // Call the API to get the layer data
      const apiUrl =
        "https://diyi9s5833.execute-api.us-east-1.amazonaws.com/ab3/getlayersdata";
      const layerData = await fetch(apiUrl).then((response) => response.json());

      // Create an object to store the layer versions by name
      const layerVersions = {};
      for (const layer of layerData.Layers) {
        layerVersions[layer.LayerName] = layer.LatestMatchingVersion.Version;
      }

      // Populate the layer values dropdown with the layer names
      layerValuesSelect.innerHTML = "";
      const layerNames = Object.keys(layerVersions);
      layerNames.unshift("Select Layer"); // Add a "Select Layer" option as the first element in the array
      for (const layerName of layerNames) {
        const option = document.createElement("option");
        option.value = layerName;
        option.text = layerName;
        layerValuesSelect.appendChild(option);
      }

      // Add an event listener to the layer values dropdown
      layerValuesSelect.addEventListener("change", function () {
        // Get the selected layer name
        const selectedLayerName = this.value;

        // Get the latest version for the selected layer name and populate the layer version dropdown
        layerVersionSelect.innerHTML = "";
        const latestVersion = layerVersions[selectedLayerName];
        const option = document.createElement("option");
        option.value = latestVersion;
        option.text = latestVersion;
        layerVersionSelect.appendChild(option);
      });
    } else {
      // Otherwise, hide the second dropdown, third dropdown, submit button, and "coming soon" label
      layerValuesSelect.style.display = "none";
      layerVersionSelect.style.display = "none";
      submitBtn.style.display = "none";
      comingSoonLabel.style.display = "block";
    }
  });
});
