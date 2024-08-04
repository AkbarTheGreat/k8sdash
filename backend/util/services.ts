import axios from 'axios';
interface Repo {
    hub: string,
    token?: string,
}

interface AppConfig {
    repositories: {
        [key: string]: Repo,
    },
}

var appConfig: AppConfig = require('../config.json');

const k8s = require('@kubernetes/client-node');
const kc = new k8s.KubeConfig();
kc.loadFromDefault();
const k8sApi = kc.makeApiClient(k8s.CoreV1Api);

interface Tag {
    last_updated: string,
    name: string,
}
export async function getServerStructure() {
    const images = await imagesForPods();
    const list = await buildReturnStruct(images);
    return list;
};

async function imagesForPods() {
    try {
        const podsRes = await k8sApi.listPodForAllNamespaces();
        let images = new Set<string>();
        for (let pod of podsRes.body.items) {
            if (pod.spec) {
                for (let container of pod.spec.containers) {
                    if (container.image) {
                        images.add(container.image);
                    }
                }
            }
        }
        return Array.from(images).sort();
    } catch (err) {
        console.error(err);
    }
    return [];
}

async function buildReturnStruct(images: Array<string>) {
    const fullStruct = [];
    for (let image of images) {
        const [name, version] = image.split(':');
        const innerStruct = {
            name: name,
            running: version,
            latest: '-'
        }
        fullStruct.push(innerStruct);
    }
    return fullStruct;
}

export async function latestForImage(image: string) {
    try {
        const [host, namespace, repository] = splitUpImage(image);
        if (!appConfig.repositories.hasOwnProperty(host)) {
            return 'Unknown Repo: ' + host;
        }
        const tags = await repoTags(appConfig.repositories[host].hub, repository, namespace) as Tag[] | undefined;
        if (!tags || tags.length == 0) {
            return 'NotFound';
        }
        return latestTag(tags);
    } catch (err) {
        console.error(err);
        return "Error";
    }
}

function latestTag(tags: Tag[]) {
    tags.sort((a, b) => b.last_updated.localeCompare(a.last_updated))
    if (tags[0].name === "latest" && tags.length > 1)
        return tags[1].name
    return tags[0].name;
}

function splitUpImage(image: string) {
    const elements = image.split('/');
    if (elements.length > 2) {
        return elements;
    }
    if (elements[0].match("\\.")) {
        return [elements[0], elements[1], elements[1]];
    }
    return ['docker.io', elements[0], elements[1]];
}

export async function repoTags(apiRoot: string, repo: string, namespace: string): Promise<Object[] | undefined> {
    const tagsUrl = `${apiRoot}repositories/${namespace}/${repo}/tags?page_size=100`
    const tagsResults = await axios.get(tagsUrl)
    if (!tagsResults || !tagsResults.data || !tagsResults.data.results) {
        return;
    }
    const tags = tagsResults.data.results;
    return tags;
}

