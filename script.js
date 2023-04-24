// define a function to handle the layer push request
function pushLayer(inputValue, idToken) {
  // create the JSON body with the input value
  const body = {
    input: inputValue,
  };

  // send a request to the API endpoint using the Fetch API
  fetch(
    "https://diyi9s5833.execute-api.us-east-1.amazonaws.com/ab3/oneclicklayerpush",
    {
      method: "POST",
      headers: {
        Authorization: idToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  )
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      console.log("Layer pushed successfully");
    })
    .catch((error) => {
      console.error("There was a problem pushing the layer:", error);
    });
}

// define a function to handle the API request
function refreshData(idToken) {
  // send a request to the API endpoint using the Fetch API

  console.log("Calling refresh api.")
  fetch(
    "https://diyi9s5833.execute-api.us-east-1.amazonaws.com/ab3/ondemanddatarefresh",
    {
      method: "POST",
      headers: {
        Authorization: idToken,
      },
    }
  )
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      console.log("Data refreshed successfully");
    })
    .catch((error) => {
      console.error("There was a problem refreshing the data:", error);
    });
}

function validateIdToken(idToken) {
  const parseJwt = (idToken) => {
    try {
      JSON.parse(atob(idToken.split(".")[1]));
      return JSON.parse(atob(idToken.split(".")[1]));
    } catch (e) {
      console.log(e);
      return null;
    }
  };
  return parseJwt(idToken);
}

document.addEventListener("DOMContentLoaded", function () {
  // Get references to the relevant elements
  const layerValuesSelect = document.querySelector("#layer-values-dropdown");
  const layerVersionSelect = document.querySelector("#layer-version-dropdown");
  const submitBtn = document.querySelector("button[type='submit']");
  const refereshBtn = document.querySelector("#refresh");
  const comingSoonLabel = document.querySelector("#coming-soon-label");

  const urlParams = window.location.hash.split("&");
  const idTokenParam = urlParams.find((param) => param.includes("id_token="));
  const idToken = idTokenParam ? idTokenParam.split("=")[1] : null;
  console.log(idToken);
  let claims = false;
  if (idToken) {
    try {
      claims = validateIdToken(idToken);
      console.log("Token validated successfully. Claims:", claims);
      // Do something with the claims
    } catch (err) {
      console.error("Error validating token:", err);
      // Handle error
    }
  }
  if (claims) {
	console.log("Claims read.. Loading other componnents.")
    // Hide the second dropdown, third dropdown, and submit button by default
    layerValuesSelect.style.display = "none";
    layerVersionSelect.style.display = "none";
    submitBtn.style.display = "none";

    //Updating refresh Button :

    refereshBtn.addEventListener("click", function (event) {
      refreshData(idToken);
    });

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
        const layerData = await fetch(apiUrl).then((response) =>
          response.json()
        );

        // Create an object to store the layer versions by name
        const layerVersions = {};
        for (const layer of layerData.Layers) {
          layerVersions[layer.LayerName] = layer.LatestMatchingVersion.Version;
        }

        // Populate the layer values dropdown with the layer names
        layerValuesSelect.innerHTML = "";
        const layerNames = Object.keys(layerVersions);
        layerNames.unshift("Select A Layer"); // Add a "Select Layer" option as the first element in the array
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
          option.text = latestVersion + ' - Latest Version';
          layerVersionSelect.appendChild(option);
        });

        // add a submit event listener to the form that calls the pushLayer function
        document
          .querySelector("form")
          .addEventListener("submit", function (event) {
            // prevent the default behavior of the form
            event.preventDefault();

            // get the selected values from the dropdowns
            const layerValue = document.getElementById(
              "layer-values-dropdown"
            ).value;
            const layerVersion = document.getElementById(
              "layer-version-dropdown"
            ).value;
            // concatenate the layer value and version with a : delimiter
            const inputValue = `${layerValue}:${layerVersion}`;

            pushLayer(inputValue, idToken);
          });
      } else {
        // Otherwise, hide the second dropdown, third dropdown, submit button, and "coming soon" label
        layerValuesSelect.style.display = "none";
        layerVersionSelect.style.display = "none";
        submitBtn.style.display = "none";
        comingSoonLabel.style.display = "block";
      }
    });
  } else {
    // Display message instead of hiding all elements
    const message = document.createElement("h");
    message.innerText = "Please log in to continue";
    message.style.margin = "auto";
    document.body.innerHTML = "";
    document.body.appendChild(message);
    document.body.style.display = "flex";
    document.body.style.justifyContent = "center";
    document.body.style.alignItems = "center";
    document.body.style.height = "100vh";
    document.body.style.width = "100vw";
  }
});
