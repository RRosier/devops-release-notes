export interface Release{
    id: number,
    name: string
}

import tl = require("azure-pipelines-task-lib/task");
import * as azdev from "azure-devops-node-api";
import * as ra from "azure-devops-node-api/ReleaseApi";
import * as ri from "azure-devops-node-api/interfaces/ReleaseInterfaces";
import * as lim from "azure-devops-node-api/interfaces/LocationsInterfaces";

let connection: azdev.WebApi | undefined;
let projectName: string = tl.getVariable("System.TeamProject")!;
let releaseApi: ra.IReleaseApi;

export async function connect(){
    let orgUrl = tl.getVariable("System.TeamFoundationCollectionUri")!;
    var token: string = tl.getVariable("System.AccessToken")!;
    if (!token || token.length === 0){
        throw "Unable to locate access token. Please make sure you have enabled the \"Allow scripts to acccess OAuth token\" setting.";
    }

    let authHandler = azdev.getPersonalAccessTokenHandler(token);
    connection = new azdev.WebApi(orgUrl, authHandler);
    let connData: lim.ConnectionData = await connection.connect();
    console.log(`Hello ${connData.authenticatedUser!.providerDisplayName}`);

    releaseApi = await connection.getReleaseApi();
}

export async function getRelease(releaseId: number): Promise<Release> {
    return new Promise<Release>(async (resolve, reject) => {

        try{
            let vstsRelease: ri.Release = await releaseApi.getRelease(projectName, releaseId);

            var r =
                {
                    id: vstsRelease.id,
                    name: vstsRelease.name
                };

            resolve(r as Release);
        }
        catch(err){
            reject(err);
        }
    });
}

function verifyConnection(){
    if (!connection){
        throw "No connection initialized. Call the 'connect' method first.";
    }
}