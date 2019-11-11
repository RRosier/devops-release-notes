import tl = require("azure-pipelines-task-lib/task");
import * as azdev from "azure-devops-node-api";
import * as ra from "azure-devops-node-api/ReleaseApi";
import * as ba from "azure-devops-node-api/BuildApi";
import * as lim from "azure-devops-node-api/interfaces/LocationsInterfaces";
import * as services from "./release";
import { write } from "fs";

function writeReleaseInfo(release: services.ReleaseInfo){
    console.log(`Release: [${release.environmentStatus}] ${release.releaseName} (${release.releaseId})`)
    console.log(`     Build: ${release.build.buildName} (${release.build.buildId})`);
    console.log(`     Environment: ${release.environmentName} (${release.environmentId}) (${release.environmentDefinitionId})`);
    console.log(`     Definition: ${release.definitionName} (${release.definitionId})`);
}

function writeDeployInfo(deploy: services.DeployInfo){
    console.log(`Deploy: [${deploy.status}] ${deploy.deploymentId} - ${deploy.definitionEnvironmentId}`);
    console.log(`     Release: ${deploy.releaseId}`);
}

async function run(){

    //// connect to azure devops
    let orgUrl = tl.getVariable("System.TeamFoundationCollectionUri")!;
    var token: string = tl.getVariable("System.AccessToken")!;
    if (!token || token.length === 0){
        throw "Unable to locate access token. Please make sure you have enabled the \"Allow scripts to acccess OAuth token\" setting.";
    }

    let authHandler = azdev.getPersonalAccessTokenHandler(token);
    let connection = new azdev.WebApi(orgUrl, authHandler);
    let connData: lim.ConnectionData = await connection.connect();
    console.log(`Connection success by ${connData.authenticatedUser!.providerDisplayName}`);

    let releaseApi: ra.IReleaseApi = await connection.getReleaseApi();
    let teamProject: string = tl.getVariable("System.TeamProject")!;

    //// get current release information
    var releaseId = +(tl.getVariable("Release.ReleaseId") || "0");
    var definitionEnvironmentId = +(tl.getVariable("Release.DefinitionEnvironmentId") || "0");
    let currentRelease: services.ReleaseInfo = await services.getReleaseInfo(releaseApi, teamProject, releaseId, definitionEnvironmentId);

    writeReleaseInfo(currentRelease);

    var previousDeploy = await services.getPreviousDeploy(releaseApi, teamProject, currentRelease.definitionId, currentRelease.environmentDefinitionId);

    writeDeployInfo(previousDeploy);

    let previousRelease: services.ReleaseInfo = await services.getReleaseInfo(releaseApi, teamProject, previousDeploy.releaseId, definitionEnvironmentId);

    writeReleaseInfo(previousRelease);

    var buildApi: ba.IBuildApi = await connection.getBuildApi();
    var workitems = await services.getWorkItems(buildApi, teamProject, previousRelease.build.buildId, currentRelease.build.buildId);
}

run();