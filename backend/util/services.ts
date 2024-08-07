const util = require('util');
const exec = util.promisify(require('child_process').exec);
import Redis from 'ioredis';

const k8s = require('@kubernetes/client-node');
const kc = new k8s.KubeConfig();
kc.loadFromDefault();
const k8sApi = kc.makeApiClient(k8s.CoreV1Api);
const redis = new Redis({ host: 'redis', port: 6379 });

interface Tag {
    lastUpdated: string,
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
        const tags = await repoTags(image) as Tag[] | undefined;
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
    for (let tag of tags) {
        if (tag.name.match('^v?\\d+\\.\\d+\\.\\d+$')) {
            return tag.name;
        }
    }

    if (tags[0].name === "latest" && tags.length > 1)
        return tags[1].name
    return tags[0].name;
}

async function repoTags(image: string): Promise<Tag[] | undefined> {
    const tagStrings = await tagList(image);

    const tags: Tag[] = await Promise.all(tagStrings.map(async (tag: string) => {
        return {
            name: tag,
            lastUpdated: await tagCreated(image, tag),
        }
    }));

    tags.sort((a, b) => b.lastUpdated.localeCompare(a.lastUpdated))
    return tags;
}

async function tagList(image: string): Promise<string[]> {
    const cached = await redis.get(`crane-tags-${image}`);
    if (cached) return JSON.parse(cached);
    const { stdout } = await exec(`crane ls --omit-digest-tags ${image}`);
    let tags = await stdout.toString().split('\n').filter((tag: string) => tag === 'latest' || tag.match('^v?\\d+\\.\\d+\\.\\d+$'));
    if (tags.length < 2) {
        tags = await stdout.toString().split('\n');
    }
    redis.set(`crane-tags-${image}`, JSON.stringify(tags), 'EX', 24 * 3600);
    return tags;
}

async function tagCreated(image: string, tag: string) {
    const cached = await redis.get(`crane-tagCreated-${image}-${tag}`);
    if (cached) return cached;
    const { stdout } = await exec(`crane config ${image}:${tag}`);
    const config = JSON.parse(stdout);
    redis.set(`crane-tagCreated-${image}-${tag}`, config.created, 'EX', 24 * 3600);
    return config.created;
}

