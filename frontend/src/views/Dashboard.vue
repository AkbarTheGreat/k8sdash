<script setup lang="ts">
    import { ref } from 'vue';
    import http from '../http-common';

    async function getLatest(name: string) {
        return await http.get("/docker/latest?image=" + name)
    }

    const services = ref([]);
    http.get("/services")
        .then(response => {
            services.value = response.data;
            for (let service of services.value as { name: string, latest: string }[]) {
                if (service.latest === '-') {
                    getLatest(service.name).then(latestResponse => service.latest = latestResponse.data)
                }
            }
        })
        .catch(e => {
            console.log(e);
        });
</script>

<template>
    <main>
        <DataTable :value="services">
            <DataColumn field="name" header="Name" />
            <DataColumn field="running" header="Version" />
            <DataColumn field="latest" header="Latest" />
        </DataTable>
    </main>
</template>
