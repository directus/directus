<template>
  <div id="nl">
    <h2>Follow the White Rabbit 🐇</h2>
    <p>Get insights, releases, and exciting news delivered directly to your inbox once a month.</p>
    <input type="email" placeholder="Your email *">
    <input type="submit" value="Subscribe">
  </div>
</template>

<style scoped>
#nl {
  background-color: var(--vp-c-purple-lightest);
  border-radius: var(--rounded-lg);
  padding: 1rem;
}

h2 {
  color: var(--vp-c-purple);
  font-size: 1.125rem;
  text-wrap: balance;
  font-weight: bold;
}

p {
  font-size: 0.75rem;
  line-height: 1.125rem;
  margin: 0.75rem 0;
  font-weight: bold;
}

input[type=email] {
  border-radius: var(--rounded-md);
  background: white;
  display: block;
  width: 100%;
  padding: 0.5em 1em;
  border: 1px solid var(--vp-c-gray-light-4);
}

input[type=email]:focus {
  border-color: var(--vp-c-gray-light-2);
}

input[type=submit] {
  background-color: var(--vp-c-purple);
  color: white;
  border-radius: var(--rounded-full);
  display: block;
  width: 100%;
  padding: 0.25em;
  margin-top: 1em;
}
</style>