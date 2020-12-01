# ycf-timebomb

Self-exploding VMs on Yandex.Cloud.

## Use

Deploy given function into your folder and put `x-timebomb-deadline` label on
required VMs. They will be removed after that date automatically.

Label value should be valid unix timestamp.

This scenario is useful for various CI/CD pipelines.

## Deploy

### CLI

Easy as 0-1-2-3 (if you have `yc` installed and configured):

0: Create service account to use Yandex.Cloud API programmatically

    export SA_ID=$(yc iam service-account create --name timebomb --format json | jq -r .)
    yc resource-manager folder add-access-binding \
        $(yc config get folder-id) \
        --subject serviceAccount:$SA_ID \
        --role editor  

1: Create Function

    yc serverless function create --name timebomb

2: Upload your code

    yc serverless function version create \
        --function-name timebomb          \
        --memory 256m                     \
        --execution-timeout 5s            \
        --runtime nodejs14                \
        --entrypoint timebomb.handler     \
        --service-account-id $(SA_ID)     \
        --source-path timebomb.js

3: Create scheduled trigger (aka `cron`)

    yc serverless trigger create timer  \
        --name timebomb                 \
        --cron-expression '* * * * ? *' \
        --invoke-function-name timebomb \
        --invoke-function-service-account-name timebomb
        
### Web Console

Just click here and there and use copy-paste. It's clean, simple and intuitive.
If you have any questions, feel free to join our [chat](https://t.me/YandexCloudFunctions)