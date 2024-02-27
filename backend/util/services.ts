import axios from 'axios';

const k8s = require('@kubernetes/client-node');
const kc = new k8s.KubeConfig();
kc.loadFromDefault();
const k8sApi = kc.makeApiClient(k8s.CoreV1Api);

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
        let latest = 'Unknown';
        try {
            latest = await latestForImage(name);
        } catch (err) {
            console.error(err);
            latest = 'Unknown';
        }
        const innerStruct = {
            name: name,
            running: version,
            latest: latest
        }
        fullStruct.push(innerStruct);
    }
    return fullStruct;
}

async function latestForImage(image: string) {
    const [host, namespace, repository] = splitUpImage(image);
    const tags = await repoTags('https://hub.docker.com/v2/', repository, namespace);
    if (!tags || tags.length == 0) {
        return 'NotFound';
    }
    console.log(tags);
    return 'Tagged';
}

function splitUpImage(image: string) {
    const elements = image.split('/');
    if (elements.length > 2) {
        return elements;
    }
    return ['hub.docker.com', elements[0], elements[1]];
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

