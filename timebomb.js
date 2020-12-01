//
// This function will delete all VMs with `x-timebomb-deadline` label in
// folder in which it's deployed.
//
// Label value should be formatted as unix timestamp.
//
// Don't forget to attach service account and grant it `editor` role
// for it's folder.
//

// Libraries below are included in Function environment
const {InstanceService} = require('yandex-cloud/api/compute/v1');
const {FunctionService} = require('yandex-cloud/api/serverless/functions/v1');

// You don't need to pass any credentials to SDK
// since we're using service account attached to function.
const instanceService = new InstanceService();

// Will get folder_id on first invocation and use it until
// execution context is alive.
let folderId = null;

module.exports.handler = async (event, context) => {
    const now = new Date();

    // Get current function' folder_id
    if (folderId === null) {
        const functionId = context.functionName;
        const func = await (new FunctionService()).get({functionId});
        folderId = func.folderId;
    }

    // List all instances in current folder
    const response = await instanceService.list({folderId});
    for (const instance of response.instances) {
        // Find label
        const timebombDeadlineValue = instance.labels['x-timebomb-deadline'];
        if (!timebombDeadlineValue || !timebombDeadlineValue.length) {
            continue;
        }

        // Parse unix timestamp from label value
        const timebombDeadlineTimestamp = parseInt(timebombDeadlineValue, 10);
        if (isNaN(timebombDeadlineTimestamp)) {
            // This message will appear in Function' logs
            console.error(`failed to parse deadline '${timebombDeadlineValue}' for instance ${instance.id}`);
            continue;
        }

        const timebombDeadline = new Date(timebombDeadlineValue * 1000);
        if (timebombDeadline < now) {
            // Actually, delete instance. This call will return long-running operation,
            // but we won't care about it's completion. Will retry on next invocation
            // until success.
            await instanceService.delete({instanceId: instance.id});
        }
    }
};
