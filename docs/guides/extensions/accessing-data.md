# Accessing Data

> TK

## Storing Sensitive Extension Variables

If your extension requires storing sensitive data, such as an API Key, you can store that information
in [custom environment variables](#). This data can then be accessed globally by server-side extensions
(eg: custom hooks or endpoints). If you need access to that private data on the client-side (eg: custom
interfaces or displays), then you would expose that env variable via a custom endpoint with proper limitations.
