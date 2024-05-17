### Pathfinder Frontend

#### Install dependencies
```shell
npm install -g yarn
yarn install
```

#### Start Frontend
```shell
yarn start
```

#### Build Frontend
```shell
yarn build
```

#### Serve built frontend
```shell
npx serve -s ./build
```

### Allow Self-Signed Localhost certificate
Chrome: enable chrome://flags/#temporary-unexpire-flags-m118 and then chrome://flags/#allow-insecure-localhost

Firefox: Go to Preferences --> Privacy & Security --> View Certificates --> Servers --> Add Exception --> Add localhost:5001
