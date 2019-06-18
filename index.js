#!/usr/bin/env node

'use strict';
const chalk = require('chalk');
const clear = require('clear');
const figlet = require('figlet');
const logic = require("./logic");
require("./commons/string");


console.log(
    chalk.yellow(
        figlet.textSync('Golgi', { horizontalLayout: 'full' })
    )
);


const program = require('commander');
program
    .version('0.0.1')
    .description('smartdoc for transactional mail/url');


program
    .command('fetch <context> [id]')
    .description('Fetch Key Info or Obj S3 to Local')
    .action(function(context, id) { logic.fetch(context, id) })
    .on('--help', function() {
        console.log('  Examples:');
        console.log('  $ golgi fetch finanskutusu.ses');
        console.log('  $ golgi fetch finanskutusu.mail');
        console.log('  $ golgi fetch finanskutusu.mailbox');
        console.log('  $ golgi fetch finanskutusu.uploads');
        console.log('  $ golgi fetch email emailID');
        console.log('  $ golgi fetch item objKey');
        console.log('  $ golgi fetch allInvoice');
        console.log('  $ golgi fetch unstructured');
        console.log('  $ golgi fetch eboxtestmailbox');
        console.log();
    });



program
    .command('info <context> [id]')
    .description('Basic Info About Context')
    .action(function(context, id) { logic.info(context, id) })
    .on('--help', function() {
        console.log('  Examples:');
        console.log('  $ golgi info s3');
        console.log('  $ golgi info mailbox');
        console.log('  $ golgi info item [itemID]');
        console.log();
    });

program
    .command('list <context> [id]')
    .alias('ls')
    .description('List Context')
    .action(function(context, id, options) {
        if (options.detail_mode == undefined) logic.list(context, id);
        else logic.listDetail(context, id, options);

    })
    .option("-d, --detail_mode <mode>", "Which detail mode count")
    .on('--help', function() {
        console.log('  Examples:');
        console.log('  $ golgi list accounts');
        console.log('  $ golgi list accounts -d count');
        console.log('  $ golgi list emails [accountID]');
        console.log('  $ golgi list emails [accountID] -d types');
        console.log('  $ golgi list email [emailID]');
        console.log();
    });



program
    .command('show <itemID>')
    .description('Show Item Content')
    .action(function(itemID) { logic.show(itemID) })
    .on('--help', function() {
        console.log('  Examples:');
        console.log('  $ golgi show <itemID>');
        console.log();
    });



program
    .command('parsemail <itemID>')
    .description('Parse Item Content')
    .option("-m, --mode <type>", "Which detail mode")
    .action(function(itemID, options) {
        logic.parseMail(itemID, options)
    })
    .on('--help', function() {
        console.log('  Examples:');
        console.log('  $ golgi parsemail <itemID> -m headers');
        console.log('  $ golgi parsemail <itemID> -m subject ');
        console.log('  $ golgi parsemail <itemID> -m to ');
        console.log('  $ golgi parsemail <itemID> -m cc ');
        console.log('  $ golgi parsemail <itemID> -m bcc ');
        console.log('  $ golgi parsemail <itemID> -m date ');
        console.log('  $ golgi parsemail <itemID> -m messageId ');
        console.log('  $ golgi parsemail <itemID> -m inReplyTo ');
        console.log('  $ golgi parsemail <itemID> -m reply-to ');
        console.log('  $ golgi parsemail <itemID> -m references ');
        console.log('  $ golgi parsemail <itemID> -m html ');
        console.log('  $ golgi parsemail <itemID> -m text');
        console.log('  $ golgi parsemail <itemID> -m textAsHtml');
        console.log('  $ golgi parsemail <itemID> -m attachments');
        console.log();
    });

program
    .command('filter')
    .description('filter mails according to options')
    .action(function(options) { logic.filter(options) })
    .option("-n, --not_contains <type>", "Filter With Not Contains")
    .option("-c, --contains <type>", "Filter With Contains")
    .on('--help', function() {
        console.log('Examples:');
        console.log('$ golgi filter -nc unstructured');
        console.log('$ golgi filter -c unstructured');
        console.log();
    });


program
    .command('debug <context>')
    .description('debug mails according to options')
    .action(function(context) { logic.debug(context) })
    .on('--help', function() {
        console.log('Examples:');
        console.log('$ golgi debug .unstructured');
        console.log();
    });


program
    .command('normalize <context>')
    .description('normalize mails according to options')
    .action(function(context) { logic.normalize(context) })
    .on('--help', function() {
        console.log('Examples:');
        console.log('$ golgi normalize mailbox');
        console.log();
    });

program
    .command('generate <context>')
    .description('generate modeldata')
    .action(function(context, options) { logic.generate(context, options) })
    .on('--help', function() {
        console.log('Examples:');
        console.log('$ golgi generate samplings');
        console.log('$ golgi generate displays');
        console.log('$ golgi generate eboxmail');
        console.log('$ golgi generate eboxtestmailbox');
        console.log('$ golgi generate eboxsamplings');
        console.log();
    });

program
    .command('puts3 <context>')
    .description('puts3 displays')
    .action(function(context, options) { logic.puts3(context, options) })
    .on('--help', function() {
        console.log('Examples:');
        console.log('$ golgi puts3 displays');
        console.log();
    });

program
    .command('createTable <tableName>')
    .alias('ls')
    .description('create tableName')
    .action(function(tableName, options) { logic.createTable(tableName, options) })
    .on('--help', function() {
        console.log('  Examples:');
        console.log('  $ golgi createTable GOLGI_USER');
        console.log('  $ golgi createTable GOLGI_ACCOUNT');
        console.log('  $ golgi createTable GOLGI_DOC');
        console.log('  $ golgi createTable GOLGI_LOG');
        console.log('  $ golgi createTable ALL_TABLE');
    });

program
    .command('deleteTable <tableName>')
    .alias('ls')
    .description('deleteTable tableName')
    .action(function(tableName, options) { logic.deleteTable(tableName, options) })
    .on('--help', function() {
        console.log('  Examples:');
        console.log('  $ golgi deleteTable GOLGI_USER');
        console.log('  $ golgi deleteTable GOLGI_ACCOUNT');
        console.log('  $ golgi deleteTable GOLGI_DOC');
        console.log('  $ golgi deleteTable ALL_TABLE');
    });

program
    .command('putItem <tableName>')
    .alias('ls')
    .description('putItem tableName')
    .action(function(tableName, options) { logic.putItem(tableName, options) })
    .on('--help', function() {
        console.log('  Examples:');
        console.log('  $ golgi putItem GOLGI_ACCOUNT');
        console.log('  $ golgi putItem GOLGI_USER');
        console.log('  $ golgi putItem GOLGI_DOC');
    });




program.parse(process.argv);