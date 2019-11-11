"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const ri = __importStar(require("azure-devops-node-api/interfaces/ReleaseInterfaces"));
function getReleaseInfo(api, project, releaseId, defEnvId) {
    return __awaiter(this, void 0, void 0, function* () {
        var r = yield api.getRelease(project, releaseId);
        if (!r || r === undefined) {
            throw `No release found for ${releaseId} in '${project}'`;
        }
        var env = r.environments.filter(function (e, i, a) { return e.definitionEnvironmentId === defEnvId; });
        if (!env || env === undefined || env.length === 0) {
            throw `No environment found for ${defEnvId}`;
        }
        return {
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
    });
}
exports.getReleaseInfo = getReleaseInfo;
function getPreviousDeploy(api, project, definitionId, environmentDefinitionId) {
    return __awaiter(this, void 0, void 0, function* () {
        var successDeployments = yield api.getDeployments(project, definitionId, environmentDefinitionId, null, null, null, ri.DeploymentStatus.Succeeded, null, true, null, null, null, null, null, null, null);
        if (!successDeployments || successDeployments === undefined || successDeployments.length === 0) {
            throw `No deployments found for project '${project}' with description ${definitionId} and environementdefinition ${environmentDefinitionId}`;
        }
        var deployment;
        if (successDeployments.length == 1) {
            //// first succesful deployment for this environment.
            deployment = successDeployments[0];
        }
        else {
            //// take previous deployment
            deployment = successDeployments[1];
        }
        return {
            deploymentId: deployment.id,
            status: deployment.deploymentStatus,
            definitionEnvironmentId: deployment.definitionEnvironmentId,
            releaseId: deployment.release.id
        };
    });
}
exports.getPreviousDeploy = getPreviousDeploy;
function getWorkItems(api, project, fromBuildId, toBuildId) {
    return __awaiter(this, void 0, void 0, function* () {
        var items = yield api.getWorkItemsBetweenBuilds(project, fromBuildId, toBuildId);
        items.forEach(function (wi, i, ar) {
            console.log(`${wi.id} - ${wi.url}`);
        });
    });
}
exports.getWorkItems = getWorkItems;
function getBuildInfo(artifacts) {
    var b = artifacts.filter(function (a, i, arr) {
        return a.isPrimary && a.type === "Build";
    });
    if (!b || b === undefined || b.length != 1) {
        throw `No primary 'build' artifact found`;
    }
    return {
        buildId: +(b[0].definitionReference.version.id || "0"),
        buildName: b[0].definitionReference.version.name
    };
}
