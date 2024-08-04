<script setup lang="ts">
    import { ref } from 'vue';
    import http from '../http-common';

    interface Service {
        name: string,
        running: string,
        latest: string,
    }

    const services = ref([] as Service[]);

    async function getLatest(service: Service) {
        const response = await http.get("/docker/latest?image=" + service.name)
        service.latest = response.data;
    }

    http.get("/services")
        .then(response => {
            services.value = response.data;
            for (let service of services.value) {
                if (service.latest === '-') {
                    getLatest(service);
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
