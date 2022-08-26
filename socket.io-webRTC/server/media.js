"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = void 0;
////////////////////////////////////////////////////////////////////////////////////
//  Azure Media Services Live streaming sample for Node.js
//
//  This sample assumes that you will use OBS Studio to broadcast RTMP
//  to the ingest endpoint. Please install OBS Studio first. 
//  Use the following settings in OBS:
//      Encoder: NVIDIA NVENC (if avail) or x264
//      Rate Control: CBR
//      Bitrate: 2500 Kbps (or something reasonable for your laptop)
//      Keyframe Interval : 2s, or 1s for low latency  
//      Preset : Low-latency Quality or Performance (NVENC) or "veryfast" using x264
//      Profile: high
//      GPU: 0 (Auto)
//      Max B-frames: 2
//      
//  The workflow for the sample and for the recommended use of the Live API:
//  1) Create the client for AMS using AAD service principal or managed ID
//  2) Set up your IP restriction allow objects for ingest and preview
//  3) Configure the Live Event object with your settings. Choose pass-through
//     or encoding live event type and size (720p or 1080p)
//  4) Create the Live Event without starting it
//  5) Create an Asset to be used for recording the live stream into
//  6) Create a Live Output, which acts as the "recorder" to record into the
//     Asset (which is like the tape in the recorder).
//  7) Start the Live Event - this can take a little bit.
//  8) Get the preview endpoint to monitor in a player for DASH or HLS.
//  9) Get the ingest RTMP endpoint URL for use in OBS Studio.
//     Set up OBS studio and start the broadcast.  Monitor the stream in 
//     your DASH or HLS player of choice. 
// 10) Create a new Streaming Locator on the recording Asset object from step 5.
// 11) Get the URLs for the HLS and DASH manifest to share with your audience
//     or CMS system. This can also be created earlier after step 5 if desired.
////////////////////////////////////////////////////////////////////////////////////
// <ImportMediaServices>
var uuid_1 = require("uuid");
// Load the .env file if it exists
var dotenv = require("dotenv");
var readlineSync = require("readline-sync");
var identity_1 = require("@azure/identity");
var arm_mediaservices_1 = require("@azure/arm-mediaservices");
var moment = require("moment");
// </ImportMediaServices>
dotenv.config();
// This is the main Media Services client object
var mediaServicesClient;
// Long running operation polling interval in milliseconds
var longRunningOperationUpdateIntervalMs = 1000;
// Copy the samples.env file and rename it to .env first, then populate it's values with the values obtained 
// from your Media Services account's API Access page in the Azure portal.
var clientId = process.env.AZURE_CLIENT_ID;
var secret = process.env.AZURE_CLIENT_SECRET;
var subscriptionId = process.env.AZURE_SUBSCRIPTION_ID;
var resourceGroup = process.env.AZURE_RESOURCE_GROUP;
var accountName = process.env.AZURE_MEDIA_SERVICES_ACCOUNT_NAME;
// This sample uses the default Azure Credential object, which relies on the environment variable settings.
// If you wish to use User assigned managed identity, see the samples for v2 of @azure/identity
// Managed identity authentication is supported via either the DefaultAzureCredential or the ManagedIdentityCredential classes
// https://docs.microsoft.com/javascript/api/overview/azure/identity-readme?view=azure-node-latest
// See the following examples for how to authenticate in Azure with managed identity
// https://github.com/Azure/azure-sdk-for-js/blob/@azure/identity_2.0.1/sdk/identity/identity/samples/AzureIdentityExamples.md#authenticating-in-azure-with-managed-identity 
// const credential = new ManagedIdentityCredential("<USER_ASSIGNED_MANAGED_IDENTITY_CLIENT_ID>");
var credential = new identity_1.DefaultAzureCredential();
//////////////////////////////////////////
//   Main entry point for sample script  //
///////////////////////////////////////////
function main() {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function () {
        var uniqueness, liveEventName, assetName, liveOutputName, streamingLocatorName, streamingEndpointName, mediaAccount, liveEvent, liveOutput, allowAllInputRange, liveEventInputAccess, liveEventPreview, liveEventCreate, timeStart_1, asset, manifestName, liveOutputCreate, liveEvent_1, ingestUrl, previewEndpoint, locator, streamingEndpoint, hostname, scheme, err_1;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    uniqueness = (0, uuid_1.v4)().split('-')[0];
                    liveEventName = "liveEvent-".concat(uniqueness) // WARNING: Be careful not to leak live events using this sample!
                    ;
                    assetName = "archiveAsset".concat(uniqueness);
                    liveOutputName = "liveOutput".concat(uniqueness);
                    streamingLocatorName = "liveStreamLocator".concat(uniqueness);
                    streamingEndpointName = "default";
                    console.log("Starting the Live Streaming sample for Azure Media Services");
                    try {
                        mediaServicesClient = new arm_mediaservices_1.AzureMediaServices(credential, subscriptionId);
                    }
                    catch (err) {
                        console.log("Error retrieving Media Services Client.");
                    }
                    return [4 /*yield*/, mediaServicesClient.mediaservices.get(resourceGroup, accountName)];
                case 1:
                    // Get the media services account object for information on the current location. 
                    mediaAccount = _c.sent();
                    _c.label = 2;
                case 2:
                    _c.trys.push([2, 17, 18, 19]);
                    allowAllInputRange = {
                        name: "AllowAll",
                        address: "0.0.0.0",
                        subnetPrefixLength: 0
                    };
                    liveEventInputAccess = {
                        ip: {
                            allow: [
                                // re-use the same range here for the sample, but in production you can lock this
                                // down to the ip range for your on-premises live encoder, laptop, or device that is sending
                                // the live stream
                                allowAllInputRange
                            ]
                        }
                    };
                    liveEventPreview = {
                        accessControl: {
                            ip: {
                                allow: [
                                    // re-use the same range here for the sample, but in production you can lock this to the IPs of your 
                                    // devices that would be monitoring the live preview. 
                                    allowAllInputRange
                                ]
                            }
                        }
                    };
                    liveEventCreate = {
                        location: mediaAccount.location,
                        description: "Sample Live Event from Node.js SDK sample",
                        // Set useStaticHostname to true to make the ingest and preview URL host name the same. 
                        // This can slow things down a bit. 
                        useStaticHostname: true,
                        //hostnamePrefix: "somethingstatic", /// When using Static host name true, you can control the host prefix name here if desired 
                        // 1) Set up the input settings for the Live event...
                        input: {
                            streamingProtocol: arm_mediaservices_1.KnownLiveEventInputProtocol.Rtmp,
                            accessControl: liveEventInputAccess,
                            // keyFrameIntervalDuration: "PT2S",  // Set this to match the ingest encoder's settings. This should not be used for encoding live event  
                            accessToken: "9eb1f703b149417c8448771867f48501" // Use this value when you want to make sure the ingest URL is static and always the same. If omitted, the service will generate a random GUID value.
                        },
                        // 2) Set the live event to use pass-through or cloud encoding modes...
                        encoding: {
                            // Set this to Basic pass-through, Standard pass-through, Standard or Premium1080P to use the cloud live encoder.
                            // See https://go.microsoft.com/fwlink/?linkid=2095101 for more information
                            // Otherwise, leave as "None" to use pass-through mode
                            encodingType: arm_mediaservices_1.KnownLiveEventEncodingType.PassthroughBasic,
                            // OPTIONS for encoding type you can use:
                            // encodingType: KnownLiveEventEncodingType.PassthroughBasic, // Basic pass-through mode - the cheapest option!
                            // encodingType: KnownLiveEventEncodingType.PassthroughStandard, // also known as standard pass-through mode (formerly "none")
                            // encodingType: KnownLiveEventEncodingType.Premium1080p,// live transcoding up to 1080P 30fps with adaptive bitrate set
                            // encodingType: KnownLiveEventEncodingType.Standard,// use live transcoding in the cloud for 720P 30fps with adaptive bitrate set
                            //
                            // OPTIONS using live cloud encoding type:
                            // keyFrameInterval: "PT2S", //If this value is not set for an encoding live event, the fragment duration defaults to 2 seconds. The value cannot be set for pass-through live events.
                            // presetName: null, // only used for custom defined presets. 
                            //stretchMode: "None" // can be used to determine stretch on encoder mode
                        },
                        // 3) Set up the Preview endpoint for monitoring based on the settings above we already set. 
                        preview: liveEventPreview,
                        // 4) Set up more advanced options on the live event. Low Latency is the most common one. 
                        streamOptions: [
                            "LowLatency"
                        ],
                        // 5) Optionally enable live transcriptions if desired. 
                        // WARNING : This is extra cost ($$$), so please check pricing before enabling. Transcriptions are not supported on PassthroughBasic.
                        //           switch this sample to use encodingType: "PassthroughStandard" first before un-commenting the transcriptions object below. 
                        /* transcriptions : [
                            {
                                inputTrackSelection: [], // chose which track to transcribe on the source input.
                                // The value should be in BCP-47 format (e.g: 'en-US'). See https://go.microsoft.com/fwlink/?linkid=2133742
                                language: "en-us",
                                outputTranscriptionTrack: {
                                    trackName : "English" // set the name you want to appear in the output manifest
                                }
                            }
                        ]
                        */
                    };
                    console.log("Creating the LiveEvent, please be patient as this can take time to complete async.");
                    console.log("Live Event creation is an async operation in Azure and timing can depend on resources available.");
                    console.log();
                    timeStart_1 = process.hrtime();
                    // When autostart is set to true, the Live Event will be started after creation. 
                    // That means, the billing starts as soon as the Live Event starts running. 
                    // You must explicitly call Stop on the Live Event resource to halt further billing.
                    // The following operation can sometimes take awhile. Be patient.
                    // On optional workflow is to first call allocate() instead of create. 
                    // https://docs.microsoft.com/en-us/rest/api/media/liveevents/allocate 
                    // This allows you to allocate the resources and place the live event into a "Standby" mode until 
                    // you are ready to transition to "Running". This is useful when you want to pool resources in a warm "Standby" state at a reduced cost.
                    // The transition from Standby to "Running" is much faster than cold creation to "Running" using the autostart property.
                    // Returns a long running operation polling object that can be used to poll until completion.
                    return [4 /*yield*/, mediaServicesClient.liveEvents.beginCreateAndWait(resourceGroup, accountName, liveEventName, liveEventCreate, 
                        // When autostart is set to true, you should "await" this method operation to complete. 
                        // The Live Event will be started after creation. 
                        // You may choose not to do this, but create the object, and then start it using the standby state to 
                        // keep the resources "warm" and billing at a lower cost until you are ready to go live. 
                        // That increases the speed of startup when you are ready to go live. 
                        {
                            autoStart: false,
                            updateIntervalInMs: longRunningOperationUpdateIntervalMs // This sets the polling interval for the long running ARM operation (LRO)
                        }).then(function (liveEvent) {
                            var timeEnd = process.hrtime(timeStart_1);
                            console.info("Live Event Created - long running operation complete! Name: ".concat(liveEvent.name));
                            console.info("Execution time for create LiveEvent: %ds %dms", timeEnd[0], timeEnd[1] / 1000000);
                            console.log();
                        }).catch(function (reason) {
                            if (reason.error && reason.error.message) {
                                console.info("Live Event creation failed: ".concat(reason.message));
                            }
                        })
                        // </CreateLiveEvent>
                        // <CreateAsset>
                        // Create an Asset for the LiveOutput to use. Think of this as the "tape" that will be recorded to. 
                        // The asset entity points to a folder/container in your Azure Storage account. 
                    ];
                case 3:
                    // When autostart is set to true, the Live Event will be started after creation. 
                    // That means, the billing starts as soon as the Live Event starts running. 
                    // You must explicitly call Stop on the Live Event resource to halt further billing.
                    // The following operation can sometimes take awhile. Be patient.
                    // On optional workflow is to first call allocate() instead of create. 
                    // https://docs.microsoft.com/en-us/rest/api/media/liveevents/allocate 
                    // This allows you to allocate the resources and place the live event into a "Standby" mode until 
                    // you are ready to transition to "Running". This is useful when you want to pool resources in a warm "Standby" state at a reduced cost.
                    // The transition from Standby to "Running" is much faster than cold creation to "Running" using the autostart property.
                    // Returns a long running operation polling object that can be used to poll until completion.
                    _c.sent();
                    // </CreateLiveEvent>
                    // <CreateAsset>
                    // Create an Asset for the LiveOutput to use. Think of this as the "tape" that will be recorded to. 
                    // The asset entity points to a folder/container in your Azure Storage account. 
                    console.log("Creating an asset named: ".concat(assetName));
                    console.log();
                    return [4 /*yield*/, mediaServicesClient.assets.createOrUpdate(resourceGroup, accountName, assetName, {})];
                case 4:
                    asset = _c.sent();
                    manifestName = "output";
                    console.log("Creating a live output named: ".concat(liveOutputName));
                    console.log();
                    // See the REST API for details on each of the settings on Live Output
                    // https://docs.microsoft.com/rest/api/media/liveoutputs/create
                    // </CreateAsset>
                    timeStart_1 = process.hrtime();
                    liveOutputCreate = void 0;
                    if (!asset.name) return [3 /*break*/, 6];
                    liveOutputCreate = {
                        description: "Optional description when using more than one live output",
                        assetName: asset.name,
                        manifestName: manifestName,
                        archiveWindowLength: "PT1H",
                        hls: {
                            fragmentsPerTsSegment: 1 // Advanced setting when using HLS TS output only.
                        },
                    };
                    // Create and await the live output
                    return [4 /*yield*/, mediaServicesClient.liveOutputs.beginCreateAndWait(resourceGroup, accountName, liveEventName, liveOutputName, liveOutputCreate, {
                            updateIntervalInMs: longRunningOperationUpdateIntervalMs // Setting this adjusts the polling interval of the long running operation. 
                        })
                            .then(function (liveOutput) {
                            console.log("Live Output Created: ".concat(liveOutput.name));
                            var timeEnd = process.hrtime(timeStart_1);
                            console.info("Execution time for create Live Output: %ds %dms", timeEnd[0], timeEnd[1] / 1000000);
                            console.log();
                        })
                            .catch(function (reason) {
                            if (reason.error && reason.error.message) {
                                console.info("Live Output creation failed: ".concat(reason.message));
                            }
                        })];
                case 5:
                    // Create and await the live output
                    _c.sent();
                    _c.label = 6;
                case 6:
                    if (!(liveEventCreate.input != null)) return [3 /*break*/, 8];
                    liveEventCreate.input.accessToken = "8257f1d1-8247-4318-b743-f541c20ea7a6";
                    liveEventCreate.hostnamePrefix = "".concat(liveEventName, "-updated");
                    // Calling update 
                    return [4 /*yield*/, mediaServicesClient.liveEvents.beginUpdateAndWait(resourceGroup, accountName, liveEventName, liveEventCreate).then(function (liveEvent) {
                            // The liveEvent returned here contains all of the updated properties you made above, and you can use the details in here to log or adjust your code. 
                            console.log("Updated the Live Event accessToken for live event named: ".concat(liveEvent.name));
                        })
                            .catch(function (reason) {
                            // Check for ErrorResponse object
                            if (reason.error && reason.error.message) {
                                console.info("Live Event Update failed: ".concat(reason.message));
                            }
                        })];
                case 7:
                    // Calling update 
                    _c.sent();
                    _c.label = 8;
                case 8:
                    console.log("Starting the Live Event operation... please stand by");
                    timeStart_1 = process.hrtime();
                    // Start the Live Event - this will take some time...
                    console.log("The Live Event is being allocated. If the service's hot pool is completely depleted in a region, this could delay here for up to 15-20 minutes while machines are allocated.");
                    console.log("If this is taking a very long time, wait for at least 20 minutes and check on the status. If the code times out, or is cancelled, be sure to clean up in the portal!");
                    return [4 /*yield*/, mediaServicesClient.liveEvents.beginStartAndWait(resourceGroup, accountName, liveEventName, {
                            updateIntervalInMs: longRunningOperationUpdateIntervalMs // Setting this adjusts the polling interval of the long running operation. 
                        }).then(function () {
                            console.log("Live Event Started");
                            var timeEnd = process.hrtime(timeStart_1);
                            console.info("Execution time for start Live Event: %ds %dms", timeEnd[0], timeEnd[1] / 1000000);
                            console.log();
                        })
                        // Refresh the liveEvent object's settings after starting it...
                    ];
                case 9:
                    _c.sent();
                    return [4 /*yield*/, mediaServicesClient.liveEvents.get(resourceGroup, accountName, liveEventName)
                        // Set some tags on this live event for later usage. 
                        // You can put anything you want on here, like a customer tenant name, id, etc.
                        // One nice trick is to set the startTime, and use that in an Azure Function to shut down any long running events that you 
                        // may have forgot about and left going for too long. 
                    ];
                case 10:
                    liveEvent_1 = _c.sent();
                    // Set some tags on this live event for later usage. 
                    // You can put anything you want on here, like a customer tenant name, id, etc.
                    // One nice trick is to set the startTime, and use that in an Azure Function to shut down any long running events that you 
                    // may have forgot about and left going for too long. 
                    liveEvent_1.tags = {
                        "startTime": moment().format()
                    };
                    return [4 /*yield*/, mediaServicesClient.liveEvents.beginUpdateAndWait(resourceGroup, accountName, liveEventName, liveEvent_1, { updateIntervalInMs: longRunningOperationUpdateIntervalMs })
                        // <GetIngestURL>
                        // Get the RTMP ingest URL to configure in OBS Studio. 
                        // The endpoints is a collection of RTMP primary and secondary, and RTMPS primary and secondary URLs. 
                        // to get the primary secure RTMPS, it is usually going to be index 3, but you could add a  loop here to confirm...
                    ];
                case 11:
                    _c.sent();
                    // <GetIngestURL>
                    // Get the RTMP ingest URL to configure in OBS Studio. 
                    // The endpoints is a collection of RTMP primary and secondary, and RTMPS primary and secondary URLs. 
                    // to get the primary secure RTMPS, it is usually going to be index 3, but you could add a  loop here to confirm...
                    if ((_a = liveEvent_1.input) === null || _a === void 0 ? void 0 : _a.endpoints) {
                        ingestUrl = liveEvent_1.input.endpoints[0].url;
                        console.log("The RTMP ingest URL to enter into OBS Studio is:");
                        console.log("RTMP ingest : ".concat(ingestUrl));
                        console.log("Make sure to enter a Stream Key into the OBS studio settings. It can be any value or you can repeat the accessToken used in the ingest URL path.");
                        console.log();
                    }
                    // </GetIngestURL>
                    // <GetPreviewURL>
                    if ((_b = liveEvent_1.preview) === null || _b === void 0 ? void 0 : _b.endpoints) {
                        previewEndpoint = liveEvent_1.preview.endpoints[0].url;
                        console.log("The preview url is:");
                        console.log(previewEndpoint);
                        console.log();
                        console.log("Open the live preview in your browser and use any DASH or HLS player to monitor the preview playback:");
                        console.log("https://ampdemo.azureedge.net/?url=".concat(previewEndpoint, "(format=mpd-time-cmaf)&heuristicprofile=lowlatency"));
                        console.log("You will need to refresh the player page SEVERAL times until enough data has arrived to allow for manifest creation.");
                        console.log("In a production player, the player can inspect the manifest to see if it contains enough content for the player to load and auto reload.");
                        console.log();
                    }
                    console.log("Start the live stream now, sending the input to the ingest url and verify that it is arriving with the preview url.");
                    console.log("IMPORTANT TIP!: Make CERTAIN that the video is flowing to the Preview URL before continuing!");
                    // </GetPreviewURL>
                    // SET A BREAKPOINT HERE!
                    console.log("PAUSE here in the Debugger until you are ready to continue...");
                    if (readlineSync.keyInYN("Do you want to continue?")) {
                        //Yes
                    }
                    else {
                        throw new Error("User canceled. Cleaning up...");
                    }
                    // Create the Streaming Locator URL for playback of the contents in the Live Output recording
                    console.log("Creating a streaming locator named : ".concat(streamingLocatorName));
                    console.log();
                    return [4 /*yield*/, createStreamingLocator(assetName, streamingLocatorName)];
                case 12:
                    locator = _c.sent();
                    console.log('streamingEndpoint start');
                    return [4 /*yield*/, mediaServicesClient.streamingEndpoints.get(resourceGroup, accountName, streamingEndpointName)];
                case 13:
                    streamingEndpoint = _c.sent();
                    console.log('streamingEndpoint end');
                    if (!((streamingEndpoint === null || streamingEndpoint === void 0 ? void 0 : streamingEndpoint.resourceState) !== "Running")) return [3 /*break*/, 15];
                    console.log("Streaming endpoint is stopped. Starting the endpoint named ".concat(streamingEndpointName));
                    return [4 /*yield*/, mediaServicesClient.streamingEndpoints.beginStartAndWait(resourceGroup, accountName, streamingEndpointName, {
                            updateIntervalInMs: longRunningOperationUpdateIntervalMs // Setting this adjusts the polling interval of the long running operation. 
                        })
                            .then(function () {
                            console.log("Streaming Endpoint Started.");
                        })];
                case 14:
                    _c.sent();
                    _c.label = 15;
                case 15:
                    // Get the url to stream the output
                    console.log("The streaming URLs to stream the live output from a client player");
                    console.log();
                    hostname = streamingEndpoint.hostName;
                    scheme = "https";
                    // The next method "buildManifestPaths" is a helper to list the streaming manifests for HLS and DASH. 
                    // The paths are only available after the live streaming source has connected. 
                    // If you wish to get the streaming manifest ahead of time, make sure to set the manifest name in the LiveOutput as done above.
                    // This allows you to have a deterministic manifest path. <streaming endpoint hostname>/<streaming locator ID>/manifestName.ism/manifest(<format string>)
                    //
                    // Uncomment this line to see how to list paths dynamically:
                    // await listStreamingPaths(streamingLocatorName, scheme, hostname);
                    // 
                    // Or use this line to build the paths statically. Which is highly recommended when you want to share the stream manifests
                    // to a player application or CMS system ahead of the live event.
                    return [4 /*yield*/, buildManifestPaths(scheme, hostname, locator.streamingLocatorId, manifestName)];
                case 16:
                    // The next method "buildManifestPaths" is a helper to list the streaming manifests for HLS and DASH. 
                    // The paths are only available after the live streaming source has connected. 
                    // If you wish to get the streaming manifest ahead of time, make sure to set the manifest name in the LiveOutput as done above.
                    // This allows you to have a deterministic manifest path. <streaming endpoint hostname>/<streaming locator ID>/manifestName.ism/manifest(<format string>)
                    //
                    // Uncomment this line to see how to list paths dynamically:
                    // await listStreamingPaths(streamingLocatorName, scheme, hostname);
                    // 
                    // Or use this line to build the paths statically. Which is highly recommended when you want to share the stream manifests
                    // to a player application or CMS system ahead of the live event.
                    _c.sent();
                    // SET A BREAKPOINT HERE!
                    console.log("PAUSE here in the Debugger until you are ready to continue...");
                    if (readlineSync.keyInYN("Do you want to continue and clean up the sample?")) {
                        //Yes
                    }
                    return [3 /*break*/, 19];
                case 17:
                    err_1 = _c.sent();
                    console.log(err_1);
                    console.error("WARNING: If you hit this message, double check the Portal to make sure you do not have any Running live events after using this Sample- or they will remain billing!");
                    return [3 /*break*/, 19];
                case 18: return [7 /*endfinally*/];
                case 19: return [2 /*return*/];
            }
        });
    });
}
exports.main = main;
main().catch(function (err) {
    console.error("Error running live streaming sample:", err.message);
    if (err.name == 'RestError') {
        // REST API Error message
        console.error("Error request:\n\n", err.request);
    }
    console.error("WARNING: If you hit this message, double check the Portal to make sure you do not have any Running live events - or they will remain billing!");
});
// <BuildManifestPaths>
// This method builds the manifest URL from the static values used during creation of the Live Output.
// This allows you to have a deterministic manifest path. <streaming endpoint hostname>/<streaming locator ID>/manifestName.ism/manifest(<format string>)
function buildManifestPaths(scheme, hostname, streamingLocatorId, manifestName) {
    return __awaiter(this, void 0, void 0, function () {
        var hlsFormat, dashFormat, manifestBase, hlsManifest, dashManifest;
        return __generator(this, function (_a) {
            hlsFormat = "format=m3u8-cmaf";
            dashFormat = "format=mpd-time-cmaf";
            manifestBase = "".concat(scheme, "://").concat(hostname, "/").concat(streamingLocatorId, "/").concat(manifestName, ".ism/manifest");
            hlsManifest = "".concat(manifestBase, "(").concat(hlsFormat, ")");
            console.log("The HLS (MP4) manifest URL is : ".concat(hlsManifest));
            console.log("Open the following URL to playback the live stream in an HLS compliant player (HLS.js, Shaka, ExoPlayer) or directly in an iOS device");
            console.log("".concat(hlsManifest));
            console.log();
            dashManifest = "".concat(manifestBase, "(").concat(dashFormat, ")");
            console.log("The DASH manifest URL is : ".concat(dashManifest));
            console.log("Open the following URL to playback the live stream from the LiveOutput in the Azure Media Player");
            console.log("https://ampdemo.azureedge.net/?url=".concat(dashManifest, "&heuristicprofile=lowlatency"));
            console.log();
            return [2 /*return*/];
        });
    });
}
// </BuildManifestPaths>
// This method demonstrates using the listPaths method on Streaming locators to print out the DASH and HLS manifest links
// Optionally you can just build the paths if you are setting the manifest name and would like to create the streaming 
// manifest URls before you actually start streaming.
// The paths in the function listPaths on streaming locators are not available until streaming has actually started.  
// Keep in mind that this workflow is not great when you need to have the manifest URL up front for a CMS. 
// It is just provided here for example of listing all the dynamic format paths available at runtime of the live event.
function listStreamingPaths(streamingLocatorName, scheme, hostname) {
    return __awaiter(this, void 0, void 0, function () {
        var streamingPaths, hlsManifest, dashManifest;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, mediaServicesClient.streamingLocators.listPaths(resourceGroup, accountName, streamingLocatorName)];
                case 1:
                    streamingPaths = _a.sent();
                    // TODO : rewrite this to be more deterministic. 
                    if (streamingPaths.streamingPaths && streamingPaths.streamingPaths.length > 0) {
                        streamingPaths.streamingPaths.forEach(function (path) {
                            if (path.streamingProtocol == "Hls") {
                                if (path.paths) {
                                    path.paths.forEach(function (hlsFormat) {
                                        // Look for the CMAF HLS format URL. This is the most current HLS version supported
                                        if (hlsFormat.indexOf('m3u8-cmaf') > 0) {
                                            hlsManifest = "".concat(scheme, "://").concat(hostname).concat(hlsFormat);
                                            console.log("The HLS (MP4) manifest URL is : ".concat(hlsManifest));
                                            console.log("Open the following URL to playback the live stream in an HLS compliant player (HLS.js, Shaka, ExoPlayer) or directly in an iOS device");
                                            console.log("".concat(hlsManifest));
                                            console.log();
                                        }
                                    });
                                }
                            }
                            if (path.streamingProtocol == "Dash") {
                                if (path.paths) {
                                    path.paths.forEach(function (dashFormat) {
                                        // Look for the CMAF DASH format URL. This is the most current DASH version supported
                                        if (dashFormat.indexOf('cmaf') > 0) {
                                            dashManifest = "".concat(scheme, "://").concat(hostname).concat(dashFormat);
                                            console.log("The DASH manifest URL is : ".concat(dashManifest));
                                            console.log("Open the following URL to playback the live stream from the LiveOutput in the Azure Media Player");
                                            console.log("https://ampdemo.azureedge.net/?url=".concat(dashManifest, "&heuristicprofile=lowlatency\""));
                                            console.log();
                                        }
                                    });
                                }
                            }
                        });
                    }
                    else {
                        console.error("No streaming paths found. Make sure that the encoder is sending data to the ingest point.");
                    }
                    return [2 /*return*/];
            }
        });
    });
}
// <CreateStreamingLocator>
function createStreamingLocator(assetName, locatorName) {
    return __awaiter(this, void 0, void 0, function () {
        var streamingLocator, locator;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    streamingLocator = {
                        assetName: assetName,
                        streamingPolicyName: "Predefined_ClearStreamingOnly" // no DRM or AES128 encryption protection on this asset. Clear means un-encrypted.
                    };
                    console.log('locator start');
                    return [4 /*yield*/, mediaServicesClient.streamingLocators.create(resourceGroup, accountName, locatorName, streamingLocator)];
                case 1:
                    locator = _a.sent();
                    console.log('locator OK');
                    return [2 /*return*/, locator];
            }
        });
    });
}
// </CreateStreamingLocator>
// <CleanUpResources>
// Stops and cleans up all resources used in the sample
// Be sure to double check the portal to make sure you do not have any accidentally leaking resources that are in billable states.
function cleanUpResources(liveEventName, liveOutputName) {
    return __awaiter(this, void 0, void 0, function () {
        var liveOutputForCleanup, timeStart, liveEventForCleanup, deleteLiveEventOperation;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, mediaServicesClient.liveOutputs.get(resourceGroup, accountName, liveEventName, liveOutputName)];
                case 1:
                    liveOutputForCleanup = _a.sent();
                    // First clean up and stop all live outputs - "recordings" 
                    // This will NOT delete the archive asset. It just stops the tape recording machine. 
                    // All tapes (asset objects) are retained in your storage account and can continue to be streamed
                    // as on-demand content without any changes. 
                    console.log("Deleting Live Output");
                    timeStart = process.hrtime();
                    if (!liveOutputForCleanup) return [3 /*break*/, 3];
                    return [4 /*yield*/, mediaServicesClient.liveOutputs.beginDeleteAndWait(resourceGroup, accountName, liveEventName, liveOutputName, {
                            updateIntervalInMs: longRunningOperationUpdateIntervalMs // Setting this adjusts the polling interval of the long running operation. 
                        })
                            .then(function () {
                            var timeEnd = process.hrtime(timeStart);
                            console.info("Execution time for delete live output: %ds %dms", timeEnd[0], timeEnd[1] / 1000000);
                            console.log();
                        })];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    ;
                    return [4 /*yield*/, mediaServicesClient.liveEvents.get(resourceGroup, accountName, liveEventName)];
                case 4:
                    liveEventForCleanup = _a.sent();
                    console.log("Stopping Live Event...");
                    if (!liveEventForCleanup) return [3 /*break*/, 8];
                    timeStart = process.hrtime();
                    if (!(liveEventForCleanup.resourceState == "Running")) return [3 /*break*/, 6];
                    return [4 /*yield*/, mediaServicesClient.liveEvents.beginStopAndWait(resourceGroup, accountName, liveEventName, {
                        // It can be faster to delete all live outputs first, and then delete the live event. 
                        // if you have additional workflows on the archive to run. Speeds things up!
                        //removeOutputsOnStop :true // this is OPTIONAL, but recommend deleting them manually first. 
                        }, {
                            updateIntervalInMs: longRunningOperationUpdateIntervalMs // Setting this adjusts the polling interval of the long running operation. 
                        })
                            .then(function () {
                            var timeEnd = process.hrtime(timeStart);
                            console.info("Execution time for Stop Live Event: %ds %dms", timeEnd[0], timeEnd[1] / 1000000);
                            console.log();
                        })];
                case 5:
                    _a.sent();
                    _a.label = 6;
                case 6:
                    timeStart = process.hrtime();
                    // Delete the Live Event
                    console.log("Deleting Live Event...");
                    return [4 /*yield*/, mediaServicesClient.liveEvents.beginDeleteAndWait(resourceGroup, accountName, liveEventName, {
                            updateIntervalInMs: longRunningOperationUpdateIntervalMs // Setting this adjusts the polling interval of the long running operation. 
                        })
                            .then(function () {
                            var timeEnd = process.hrtime(timeStart);
                            console.info("Execution time for Delete Live Event: %ds %dms", timeEnd[0], timeEnd[1] / 1000000);
                            console.log();
                        })
                        // IMPORTANT! Open the portal again and make CERTAIN that the live event is stopped and deleted - and that you do not have any billing live events running still.
                    ];
                case 7:
                    deleteLiveEventOperation = _a.sent();
                    _a.label = 8;
                case 8: return [2 /*return*/];
            }
        });
    });
}
