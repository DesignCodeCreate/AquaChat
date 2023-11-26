<script>
    export let message;

    function formatTime(timestamp) {
        let date = new Date(parseInt(timestamp));
        return `${date.getDate()}/${date.getMonth()}/${date.getFullYear()} - ${date.toTimeString().slice(0, -34)}`;
    }
</script>

<p class="break-words">
    <b> {message.member.name} - {formatTime(message.created_at)} </b><br />
    {@html message.content}
</p>
