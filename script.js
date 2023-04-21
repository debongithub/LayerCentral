
// Validate and get claims
function validateIdToken(idToken) {
  return new Promise((resolve, reject) => {
    
    // Initialize Cognito userpool client
    const poolData = {
      UserPoolId: "us-east-1_KbsERc55E",
      ClientId: "29uilsdqn86ki39ti4fhjqfdvm",
    };
    const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);

    var cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider({
      apiVersion: "2016-04-18",
      region: "us-east-1", // Update the region to match your Cognito user pool region
    });

    const cognitoUser = userPool.getCurrentUser();
    if (cognitoUser != null) {
      cognitoUser.getSession((err, session) => {
        if (err) {
          reject(err);
        } else {
          const jwt = session.getIdToken().getJwtToken();
          if (jwt === idToken) {
            const payload = jwtDecode(idToken);
            resolve(payload);
          } else {
            reject("Invalid token");
          }
        }
      });
    } else {
      reject("No user found");
    }
  });
}

document.addEventListener("DOMContentLoaded", function () {
  // Get references to the relevant elements
  const layerValuesSelect = document.querySelector("#layer-values-dropdown");
  const layerVersionSelect = document.querySelector("#layer-version-dropdown");
  const submitBtn = document.querySelector("button[type='submit']");
  const refereshBtn = document.querySelector("button[type='submit']");
  const comingSoonLabel = document.querySelector("#coming-soon-label");

  const urlParams = new URLSearchParams(window.location.search);
  console.log(urlParams)
  idTok = location.hash.split('&')[0].split('=')[1];
  console.log(idTok)
  const idToken = urlParams.get("id_token");
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
