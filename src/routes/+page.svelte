<script lang="ts">
	export let data: any;
</script>

<h1>This album is called:</h1>
<div>{@html data.album.title}</div>
<img src={data.album.image} alt={`Album art for ${data.album.title}`} />
