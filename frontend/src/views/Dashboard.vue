<script setup lang="ts">
    import { ref } from 'vue';
    import http from '../http-common';

    const services = ref([]);
    http.get("/services")
        .then(response => {
            services.value = response.data;
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
