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
const tl = require("azure-pipelines-task-lib/task");
const azdev = __importStar(require("azure-devops-node-api"));
const services = __importStar(require("./release"));
function writeReleaseInfo(release) {
    console.log(`Release: [${release.environmentStatus}] ${release.releaseName} (${release.releaseId})`);
    console.log(`     Build: ${release.build.buildName} (${release.build.buildId})`);
    console.log(`     Environment: ${release.environmentName} (${release.environmentId}) (${release.environmentDefinitionId})`);
    console.log(`     Definition: ${release.definitionName} (${release.definitionId})`);
}
function writeDeployInfo(deploy) {
    console.log(`Deploy: [${deploy.status}] ${deploy.deploymentId} - ${deploy.definitionEnvironmentId}`);
    console.log(`     Release: ${deploy.releaseId}`);
}
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        //// connect to azure devops
        let orgUrl = tl.getVariable("System.TeamFoundationCollectionUri");
        var token = tl.getVariable("System.AccessToken");
        if (!token || token.length === 0) {
            throw "Unable to locate access token. Please make sure you have enabled the \"Allow scripts to acccess OAuth token\" setting.";
        }
        let authHandler = azdev.getPersonalAccessTokenHandler(token);
        let connection = new azdev.WebApi(orgUrl, authHandler);
        let connData = yield connection.connect();
        console.log(`Connection success by ${connData.authenticatedUser.providerDisplayName}`);
        let releaseApi = yield connection.getReleaseApi();
        let teamProject = tl.getVariable("System.TeamProject");
        //// get current release information
        var releaseId = +(tl.getVariable("Release.ReleaseId") || "0");
        var definitionEnvironmentId = +(tl.getVariable("Release.DefinitionEnvironmentId") || "0");
        let currentRelease = yield services.getReleaseInfo(releaseApi, teamProject, releaseId, definitionEnvironmentId);
        writeReleaseInfo(currentRelease);
        var previousDeploy = yield services.getPreviousDeploy(releaseApi, teamProject, currentRelease.definitionId, currentRelease.environmentDefinitionId);
        writeDeployInfo(previousDeploy);
        let previousRelease = yield services.getReleaseInfo(releaseApi, teamProject, previousDeploy.releaseId, definitionEnvironmentId);
        writeReleaseInfo(previousRelease);
        var buildApi = yield connection.getBuildApi();
        var workitems = yield services.getWorkItems(buildApi, teamProject, previousRelease.build.buildId, currentRelease.build.buildId);
    });
}
run();
