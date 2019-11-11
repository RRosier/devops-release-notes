import tl = require("azure-pipelines-task-lib/task");
import * as ra from "azure-devops-node-api/ReleaseApi";
import * as ri from "azure-devops-node-api/interfaces/ReleaseInterfaces";
import * as ba from "azure-devops-node-api/BuildApi";

export interface ReleaseInfo{
    releaseId: number;
    releaseName: string;
    environmentName: string;
    environmentId: number;
    environmentDefinitionId: number;
    environmentStatus: ri.EnvironmentStatus;
    definitionId: number;
    definitionName: string;
    build: BuildInfo;
}

export interface BuildInfo{
    buildId: number;
    buildName: string;
}

export interface DeployInfo{
    deploymentId: number;
    status: ri.DeploymentStatus;
    definitionEnvironmentId: number;
    releaseId: number;
}

export async function getReleaseInfo(api: ra.IReleaseApi, project: string, releaseId: number, defEnvId: number){
    var r = await api.getRelease(project, releaseId);
    if (!r || r === undefined){
        throw `No release found for ${releaseId} in '${project}'`;
    }

    var env = r.environments.filter(function(e, i, a){ return e.definitionEnvironmentId === defEnvId });
    if (!env || env === undefined || env.length === 0){
        throw `No environment found for ${defEnvId}`;
    }

    return{
        releaseId: r.id,
        releaseName: r.name,
        environmentName: env[0].name,
        environmentId: env[0].id,
        environmentDefinitionId: env[0].definitionEnvironmentId,
        environmentStatus: env[0].status,
        definitionId: r.releaseDefinition.id,
        definitionName: r.releaseDefinition.name,
        build: getBuildInfo(r.artifacts)
    };
}

export async function getPreviousDeploy(api: ra.IReleaseApi, project: string, definitionId: number, environmentDefinitionId: number){
    var successDeployments = await api.getDeployments(project, definitionId, environmentDefinitionId, null, null, null, ri.DeploymentStatus.Succeeded, null, true, null, null, null, null, null, null, null);
    if(!successDeployments || successDeployments === undefined || successDeployments.length === 0){
        throw `No deployments found for project '${project}' with description ${definitionId} and environementdefinition ${environmentDefinitionId}`
    }

    var deployment: ri.Deployment;

    if (successDeployments.length == 1){
        //// first succesful deployment for this environment.
        deployment = successDeployments[0];
    }
    else{
        //// take previous deployment
        deployment = successDeployments[1];
    }

    return {
        deploymentId: deployment.id,
        status: deployment.deploymentStatus,
        definitionEnvironmentId: deployment.definitionEnvironmentId,
        releaseId: deployment.release.id
    };
}

export async function getWorkItems(api:ba.IBuildApi, project:string, fromBuildId: number, toBuildId: number){
    var items = await api.getWorkItemsBetweenBuilds(project, fromBuildId, toBuildId);
    items.forEach(function(wi, i, ar){
        console.log(`${wi.id} - ${wi.url}`);
    });
}

function getBuildInfo(artifacts: ri.Artifact[]) : BuildInfo{
    var b = artifacts.filter(function(a, i, arr){
        return a.isPrimary && a.type === "Build";
    });

    if (!b || b === undefined || b.length != 1){
        throw `No primary 'build' artifact found`;
    }

    return {
        buildId: +(b[0].definitionReference.version.id || "0"),
        buildName: b[0].definitionReference.version.name    
    }
}