FROM public.ecr.aws/x8v8d7g8/mars-base:latest

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --no-frozen-lockfile

COPY . .

CMD ["bash"]
