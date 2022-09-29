# How to test this locally?

You can run either of the command to test the email function

```sh
yarn run email:mock:harry
yarn run email:mock:bolin
```

These will then use the `event-harry.json` or `event-bolin.json` to create and send
emails to one of us. You can also edit the `emailReceivers` fields in the json files to send the email to yourself.
