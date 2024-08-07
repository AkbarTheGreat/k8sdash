<script setup lang="ts">
import { inject } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import Button from 'primevue/button'

interface Link {
    url: string,
    display_name: string,
}

const links: Link[] = inject('links') as Link[];

</script>

<template>
    <header>
        <div class="wrapper">
            <nav>
                <Button as="router-link" label="Home" to="/" />
                <Button as="a" v-for="(link, name, _) in links" :label="'' + name" :href="link.url" target="_blank"
                    rel="noopener" />
            </nav>
        </div>
    </header>

    <RouterView />
</template>
