<template>
	<div id="app">
		<router-view />
	</div>
</template>

<style>
:root {
  --bg-color: #28221d;
  --bg-color-2: #2f2f2f;
  --text-color: white;
  --text-color-2: grey;
  --text-color-3: #ffc55a;
  --detail-color: orange;
  --highlight-color: #ffa60036;
}
body {
  margin: 0;
  font-family: Arial;
  background-color: var(--bg-color);
  color: var(--text-color);
}
#app {
  height: 100vh;
}
a {
  color: var(--detail-color);
}
.disable-select {
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}
</style>
