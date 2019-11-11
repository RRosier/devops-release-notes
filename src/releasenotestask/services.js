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
let connection;
let projectName = tl.getVariable("System.TeamProject");
let releaseApi;
function connect() {
    return __awaiter(this, void 0, void 0, function* () {
        let orgUrl = tl.getVariable("System.TeamFoundationCollectionUri");
        var token = tl.getVariable("System.AccessToken");
        if (!token || token.length === 0) {
            throw "Unable to locate access token. Please make sure you have enabled the \"Allow scripts to acccess OAuth token\" setting.";
        }
        let authHandler = azdev.getPersonalAccessTokenHandler(token);
        connection = new azdev.WebApi(orgUrl, authHandler);
        let connData = yield connection.connect();
        console.log(`Hello ${connData.authenticatedUser.providerDisplayName}`);
        releaseApi = yield connection.getReleaseApi();
    });
}
exports.connect = connect;
function getRelease(releaseId) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            try {
                let vstsRelease = yield releaseApi.getRelease(projectName, releaseId);
                var r = {
                    id: vstsRelease.id,
                    name: vstsRelease.name
                };
                resolve(r);
            }
            catch (err) {
                reject(err);
            }
        }));
    });
}
exports.getRelease = getRelease;
function verifyConnection() {
    if (!connection) {
        throw "No connection initialized. Call the 'connect' method first.";
    }
}
