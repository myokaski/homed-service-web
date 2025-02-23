class Automation
{
    triggerType = ['property', 'mqtt', 'telegram', 'time', 'interval'];
    triggerStatement = ['equals', 'above', 'below', 'between', 'changes', 'updates'];

    conditionType = ['property', 'mqtt', 'state', 'date', 'time', 'week', 'AND', 'OR', 'NOT'];
    conditionStatement = ['equals', 'differs', 'above', 'below', 'between'];

    actionType = ['property', 'mqtt', 'state', 'telegram', 'shell', 'condition', 'delay'];
    actionStatement = ['value', 'increase', 'decrease'];

    content = document.querySelector('.content .container');
    status = new Object();

    constructor(controller)
    {
        this.controller = controller;
    }

    parseMessage(list, message)
    {
        switch (list[0])
        {
            case 'status':

                this.status = message;

                if (this.controller.service == 'automation')
                {
                    document.querySelector('#serviceVersion').innerHTML = this.status.version;
                    this.showAutomationList();
                }

                break;

            case 'event':

                var html = 'Automation <b>' + message.automation + '</b> ';

                if (message.event == 'added' || message.event == 'updated')
                    this.controller.clearPage('automation');

                switch (message.event)
                {
                    case 'nameDuplicate':  this.controller.showToast(html + 'name is already in use', 'error'); return;
                    case 'incompleteData': this.controller.showToast(html + 'data is incomplete', 'error'); return;
                    case 'added':          this.controller.showToast(html + 'successfully added'); return;
                    case 'updated':        this.controller.showToast(html + 'successfully updated'); return;
                    case 'removed':        this.controller.showToast(html + 'removed', 'warning'); return;
                }

                break;
        }
    }

    parseValue(value)
    {
        return value == 'true' || value == 'false' ? value == 'true' : isNaN(value) ? value : parseFloat(value);
    }

    valueForm(form, statement)
    {
        switch (statement)
        {
            case 'between':
                form.querySelector('.between').style.display = 'block';
                form.querySelector('.other').style.display = 'none';
                break;

            case 'updates':
                form.querySelector('.between').style.display = 'none';
                form.querySelector('.other').style.display = 'none';
                break;

            default:
                form.querySelector('.between').style.display = 'none';
                form.querySelector('.other').style.display = 'block';
                break;
        }
    }

    updateLastTriggered(row, lastTriggered)
    {
        if (!lastTriggered)
            return;

        row.querySelector('.lastTriggered').innerHTML = timeInterval((Date.now() - lastTriggered) / 1000);
    }

    triggerInfo(trigger)
    {
        var data;

        switch (trigger.type)
        {
            case 'property':
            case 'mqtt':

                for (var i = 0; i < this.triggerStatement.length; i++)
                {
                    var statement = this.triggerStatement[i];

                    if (!trigger.hasOwnProperty(statement))
                        continue;

                    data = '<span class="value">' + (trigger.type == 'mqtt' ? trigger.topic : trigger.endpoint) + '</span> ' + (trigger.property ? '&rarr; <span class="value">' + trigger.property + '</span> ' : '') + statement;

                    if (statement == 'updates')
                        break;

                    data += ' <span class="value">' + (statement == 'between' && Array.isArray(trigger[statement]) ? trigger[statement].join('</span> and <span class="value">') : trigger[statement]) + '</span>';
                }

                break;

            case 'telegram':
                data = '<span class="value">' + trigger.message + '</span>' + (trigger.chats ? ' from <span class="value">' + trigger.chats.join(', ') + '</span>': '');
                break;

            case 'time':
                data = '<span class="value">' + trigger.time + '</span>';
                break;

            case 'interval':
                data = 'every <span class="value">' + trigger.interval + '</span> ' + (trigger.interval != 1 ? 'minutes' : 'minute');
                break;
        }

        if (trigger.name)
            data += ' with name <span class="value">' + trigger.name + '</span>';

        return data;
    }

    conditionInfo(condition)
    {
        if (condition.type == 'week')
            return '<span class="value">' + condition.days.join(', ') + '</span>';

        for (var i = 0; i < this.conditionStatement.length; i++)
        {
            var statement = this.conditionStatement[i];
            var value;

            if (!condition.hasOwnProperty(statement))
                continue;

            value = statement == 'between' && Array.isArray(condition[statement]) ? condition[statement].join('</span> and <span class="value">') : condition[statement];

            switch (condition.type)
            {
                case 'property':
                case 'mqtt':
                    return '<span class="value">' + (condition.type == 'mqtt' ? condition.topic : condition.endpoint) + '</span> ' + (condition.property ? '&rarr; <span class="value">' + condition.property + '</span> ' : '') + statement + ' <span class="value">' + value + '</span>';

                case 'state':
                    return '<span class="value">' + condition.name + '</span> ' + statement + ' <span class="value">' + value + '</span>';

                case 'date':
                    return statement + ' <span class="value">' + value + '</span>';

                case 'time':
                    return statement + ' <span class="value">' + value + '</span>';
            }
        }
    }

    actionInfo(action)
    {
        var data;

        switch (action.type)
        {
            case 'property':

                for (var i = 0; i < this.actionStatement.length; i++)
                {
                    var statement = this.actionStatement[i];

                    if (!action.hasOwnProperty(statement))
                        continue;

                    data = '<span class="value">' + action.endpoint + '</span> &rarr; <span class="value">' + action.property + '</span> &rarr; ' + (statement == 'increase' ? '<span class="value">+</span> ' : statement == 'decrease' ? '<span class="value">-</span> ' : '') + '<span class="value">' + action[statement] + '</span>';
                }

                break;

            case 'mqtt':
                data = '<span class="value">' + action.message + '</span> to <span class="value">' + action.topic + '</span> topic' + (action.retain ? ' <span class="value">retained</span>' : '');
                break;

            case 'state':
                data = (action.value || action.value == false ? 'set' : 'remove') + ' <span class="value">' + action.name + '</span>' + (action.value || action.value == false ? ' to <span class="value">' + action.value + '</span>' : '');
                break;

            case 'telegram':
                data = '<span class="value">' + action.message + '</span>' + (action.chats ? ' to <span class="value">' + action.chats.join(', ') + '</span>': '') + (action.silent ? ' [silent]' : '');
                break;

            case 'shell':
                data = '<span class="value">' + action.command + '</span>';
                break;

            case 'delay':
                data = '<span class="value">' + action.delay + '</span> seconds';
                break;
        }

        if (action.triggerName)
            data += ' when trigger is <span class="value">' + action.triggerName + '</span>';

        return data;
    }

    conditionDropdown(automation, list, type)
    {
        if (type == 'AND' || type == 'OR' || type == 'NOT')
        {
            list.push({'type': type, 'conditions': new Array()});
            automation.showAutomationInfo();
            return;
        }

        automation.showCondition({'type': type}, list, true);
    }

    conditionList(automation, list, table, level = 0, colSpan = 0)
    {
        list.forEach((condition, index) =>
        {
            var row = table.insertRow();

            for (var i = 0; i < 3; i++)
            {
                var cell = row.insertCell();

                switch (i)
                {
                    case 0:
                        for (var j = 0; j < level; j++) cell.innerHTML += '<span class="' + (j < level - 1 ? 'shade' : 'warning') + '">&#8618;</span> ';
                        cell.innerHTML += condition.type == 'AND' || condition.type == 'OR' || condition.type == 'NOT' ? '<span class="value">' + condition.type + '</span>' : condition.type;
                        break;

                    case 1:

                        if (colSpan)
                            cell.colSpan = colSpan;

                        if (condition.type == 'AND' || condition.type == 'OR' || condition.type == 'NOT')
                        {
                            cell.innerHTML = '<div class="dropdown"><i class="icon-plus"></i></div>';
                            cell.classList.add('right');
                            addDropdown(cell.querySelector('.dropdown'), automation.conditionType, function(type) { automation.conditionDropdown(automation, condition.conditions, type); }, 6);
                            automation.conditionList(automation, condition.conditions, table, level + 1, colSpan);
                            break;
                        }

                        cell.innerHTML = automation.conditionInfo(condition) ?? '<i>undefined</i>';
                        cell.classList.add('edit');
                        cell.addEventListener('click', function() { automation.showCondition(condition, list); });
                        break;

                    case 2:
                        cell.innerHTML = '<i class="icon-trash"></i>';
                        cell.classList.add('remove', 'right');
                        cell.addEventListener('click', function() { list.splice(index, 1); automation.showAutomationInfo(); });
                        break;
                }
            }
        });
    }

    actionDropdown(automation, list, type)
    {
        if (type == 'condition')
        {
            list.push({'type': type, 'conditions': new Array(), 'then': new Array(), 'else': new Array()});
            automation.showAutomationInfo();
            return;
        }

        automation.showAction({'type': type}, list, true);
    }

    actionList(automation, list, table, level = 0)
    {
        list.forEach((action, index) =>
        {
            var row = table.insertRow();

            for (var i = 0; i < 5; i++)
            {
                var cell = row.insertCell();

                switch (i)
                {
                    case 0:
                        for (var j = 0; j < level; j++) cell.innerHTML += '<span class="' + (j < level - 1 ? 'shade' : 'warning') + '">&#8618;</span> ';
                        cell.innerHTML += action.type == 'condition' ? '<span class="value">CONDITION</span>' : action.type;
                        break;

                    case 1:

                        if (action.type != 'condition')
                        {
                            cell.innerHTML = automation.actionInfo(action) ?? '<i>undefined</i>';
                            cell.classList.add('edit');
                            cell.addEventListener('click', function() { automation.showAction(action); });
                            break;
                        }

                        for (var j = 0; j < 3; j++)
                        {
                            var actionRow = table.insertRow();
                            var nameCell = actionRow.insertCell();
                            var actionCell = actionRow.insertCell();

                            for (var k = 0; k <= level; k++)
                                nameCell.innerHTML += '<span class="' + (k < level ? 'shade' : 'warning') + '">&#8618;</span> ';

                            nameCell.colSpan = 4;
                            actionCell.innerHTML = '<div class="dropdown"><i class="icon-plus"></i></div>';

                            switch (j)
                            {
                                case 0:
                                    nameCell.innerHTML += '<span class="value">IF</span>';
                                    addDropdown(actionCell.querySelector('.dropdown'), automation.conditionType, function(type) { automation.conditionDropdown(automation, action.conditions, type); }, 6);
                                    automation.conditionList(automation, action.conditions, table, level + 2, 3);
                                    break;

                                case 1:
                                    nameCell.innerHTML += '<span class="value">THEN</span>';
                                    addDropdown(actionCell.querySelector('.dropdown'), automation.actionType, function(type) { automation.actionDropdown(automation, action.then, type); }, 5);
                                    automation.actionList(automation, action.then, table, level + 2);
                                    break;

                                case 2:
                                    nameCell.innerHTML += '<span class="value">ELSE</span>';
                                    addDropdown(actionCell.querySelector('.dropdown'), automation.actionType, function(type) { automation.actionDropdown(automation, action.else, type); }, 5);
                                    automation.actionList(automation, action.else, table, level + 2);
                                    break;
                            }
                        }

                        break;

                    case 3:

                        if (list.length < 2 || !index)
                            break;

                        cell.innerHTML = '&uarr;';
                        cell.classList.add('move');
                        cell.addEventListener('click', function() { list[index - 1] =  list.splice(index, 1, list[index - 1])[0]; automation.showAutomationInfo(); });
                        break;

                    case 2:

                        if (list.length < 2 || index == list.length - 1)
                            break;

                        cell.innerHTML = '&darr;';
                        cell.classList.add('move');
                        cell.addEventListener('click', function() { list[index + 1] =  list.splice(index, 1, list[index + 1])[0]; automation.showAutomationInfo(); });
                        break;


                    case 4:
                        cell.innerHTML = '<i class="icon-trash"></i>';
                        cell.classList.add('remove');
                        cell.addEventListener('click', function() { list.splice(index, 1); automation.showAutomationInfo(); });
                        break;
                }
            }
        });
    }

    showMenu()
    {
        var menu = document.querySelector('.menu');

        menu.innerHTML = null;

        menu.innerHTML += '<span id="list"><i class="icon-list"></i> List</span>';
        menu.innerHTML += '<span id="add"><i class="icon-plus"></i> Add</span>';

        menu.querySelector('#list').addEventListener('click', function() { this.showAutomationList(); }.bind(this));
        menu.querySelector('#add').addEventListener('click', function() { this.showAutomationInfo(true); }.bind(this));

        if (!this.status)
            return;

        document.querySelector('#serviceVersion').innerHTML = this.status.version;
    }

    showAutomationList()
    {
        this.controller.setService('automation');
        this.controller.setPage('automation');

        if (!this.status.automations || !this.status.automations.length)
        {
            this.content.innerHTML = '<div class="emptyList">automations list is empty</div>';
            return;
        }

        fetch('html/automation/automationList.html?' + Date.now()).then(response => response.text()).then(html =>
        {
            var table;

            this.content.innerHTML = html;
            table = this.content.querySelector('.itemList table');

            this.status.automations.forEach(item =>
            {
                var row = table.querySelector('tbody').insertRow();

                if (!item.conditions)
                    item.conditions = new Array();

                row.addEventListener('click', function() { this.data = JSON.parse(JSON.stringify(item)); this.name = item.name; this.showAutomationInfo(); }.bind(this));

                for (var i = 0; i < 6; i++)
                {
                    var cell = row.insertCell();

                    switch (i)
                    {
                        case 0: cell.innerHTML = item.name; break;
                        case 1: cell.innerHTML = item.active ? '<i class="icon-true success"></i>' : '<i class="icon-false error"></i>'; cell.classList.add('center'); break;
                        case 2: cell.innerHTML = '<span class="value">' + item.triggers.length + '</span>'; cell.classList.add('center'); break;
                        case 3: cell.innerHTML = item.conditions.length ? '<span class="value">' + item.conditions.length + '</span>' : empty; cell.classList.add('center'); break;
                        case 4: cell.innerHTML = '<span class="value">' + item.actions.length + '</span>'; cell.classList.add('center'); break;
                        case 5: cell.innerHTML = empty; cell.classList.add('lastTriggered', 'right'); break;
                    }
                }

                this.updateLastTriggered(row, item.lastTriggered);
            });

            table.querySelectorAll('th.sort').forEach(cell => cell.addEventListener('click', function() { sortTable(table, this.dataset.index); localStorage.setItem('automationSort', this.dataset.index); }) );
            sortTable(table, localStorage.getItem('automationSort') ?? 0);
        });
    }

    showAutomationInfo(add = false)
    {
        this.controller.setService('automation');
        this.controller.setPage('automationInfo');

        fetch('html/automation/automationInfo.html?' + Date.now()).then(response => response.text()).then(html =>
        {
            var triggers;
            var conditions;
            var actions;

            this.content.innerHTML = html;

            if (add)
            {
                this.data = {active: true, triggers: new Array(), conditions: new Array(), actions: new Array()};
                this.name = null;
            }

            if (!this.data.name)
                this.data.name = 'Automation ' + Math.random().toString(36).substring(2, 7);

            if (!this.name)
            {
                this.content.querySelector('.copy').style.display = 'none';
                this.content.querySelector('.remove').style.display = 'none';
            }

            this.content.querySelector('.edit').addEventListener('click', function() { this.showAutomationEdit(); }.bind(this));
            this.content.querySelector('.copy').addEventListener('click', function() { this.data.name += ' (copy)'; this.data.active = false; this.name = null; this.showAutomationInfo(); }.bind(this));
            this.content.querySelector('.remove').addEventListener('click', function() { this.showAutomationRemove(); }.bind(this));
            this.content.querySelector('.save').addEventListener('click', function() { this.controller.socket.publish('command/automation', {action: 'updateAutomation', automation: this.name, data: this.data}); }.bind(this));

            this.content.querySelector('.name').innerHTML = this.data.name + (this.name ? '' : ' <span class="warning value">NEW</span>');
            this.content.querySelector('.debounce').innerHTML = '<span class="value">' + (this.data.debounce ?? 0) + '</span> seconds';
            this.content.querySelector('.restart').innerHTML = '<span class="value">' + (this.data.restart ?? false) + '</span>';
            this.content.querySelector('.active').innerHTML = this.data.active ? '<i class="icon-true success"></i>' : '<i class="icon-false error"></i>';

            triggers = this.content.querySelector('.triggers');
            conditions = this.content.querySelector('.conditions');
            actions = this.content.querySelector('.actions');

            addDropdown(this.content.querySelector('.addTrigger'), this.triggerType, function(type) { this.showTrigger({'type': type}, true); }.bind(this));
            addDropdown(this.content.querySelector('.addCondition'), this.conditionType, function(type) { this.conditionDropdown(this, this.data.conditions, type); }.bind(this), 6);
            addDropdown(this.content.querySelector('.addAction'), this.actionType, function(type) { this.actionDropdown(this, this.data.actions, type); }.bind(this), 5);

            this.data.triggers.forEach((trigger, index) =>
            {
                var row = triggers.insertRow();

                for (var i = 0; i < 3; i++)
                {
                    var cell = row.insertCell();

                    switch (i)
                    {
                        case 0: cell.innerHTML = trigger.type; break;

                        case 1:
                            cell.innerHTML = this.triggerInfo(trigger) ?? '<i>undefined</i>';
                            cell.classList.add('edit');
                            cell.addEventListener('click', function() { this.showTrigger(trigger); }.bind(this));
                            break;

                        case 2:
                            cell.innerHTML = '<i class="icon-trash"></i>';
                            cell.classList.add('remove');
                            cell.addEventListener('click', function() { this.data.triggers.splice(index, 1); this.showAutomationInfo(); }.bind(this));
                            break;
                    }
                }
            });

            this.conditionList(this, this.data.conditions, conditions);
            this.actionList(this, this.data.actions, actions);

            showModal(false);
        });
    }

    showAutomationEdit()
    {
        fetch('html/automation/automationEdit.html?' + Date.now()).then(response => response.text()).then(html =>
        {
            modal.querySelector('.data').innerHTML = html;
            modal.querySelector('.name').innerHTML = this.data.name;
            modal.querySelector('input[name="name"]').value = this.data.name;
            modal.querySelector('input[name="debounce"]').value = this.data.debounce ?? 0;
            modal.querySelector('input[name="restart"]').checked = this.data.restart ?? false;
            modal.querySelector('input[name="active"]').checked = this.data.active;

            modal.querySelector('.save').addEventListener('click', function()
            {
                var data = formData(modal.querySelector('form'));

                this.data.name = data.name;
                this.data.debounce = parseInt(data.debounce);
                this.data.restart = data.restart;
                this.data.active = data.active;

                this.showAutomationInfo();

            }.bind(this));

            modal.querySelector('.cancel').addEventListener('click', function() { showModal(false); });

            modal.removeEventListener('keypress', handleSave);
            modal.addEventListener('keypress', handleSave);
            showModal(true);

            modal.querySelector('input[name="name"]').focus();
        });
    }

    showAutomationRemove()
    {
        fetch('html/automation/automationRemove.html?' + Date.now()).then(response => response.text()).then(html =>
        {
            modal.querySelector('.data').innerHTML = html;
            modal.querySelector('.name').innerHTML = this.data.name;
            modal.querySelector('.remove').addEventListener('click', function() { this.controller.socket.publish('command/automation', {action: 'removeAutomation', automation: this.name}); this.controller.clearPage('automation'); }.bind(this));
            modal.querySelector('.cancel').addEventListener('click', function() { showModal(false); });

            showModal(true);
        });
    }

    showTrigger(trigger, append = false)
    {
        switch (trigger.type)
        {
            case 'property': this.showPropertyItem(trigger, this.data.triggers, this.triggerStatement, append, 'trigger'); break;
            case 'mqtt':     this.showPropertyItem(trigger, this.data.triggers, this.triggerStatement, append, 'trigger', true); break;
            case 'telegram': this.showTelegramTrigger(trigger, append); break;
            case 'time':     this.showTimeTrigger(trigger, append); break;
            case 'interval': this.showIntervalTrigger(trigger, append); break;
        }
    }

    showCondition(condition, list, append = false)
    {
        switch (condition.type)
        {
            case 'property': this.showPropertyItem(condition, list, this.conditionStatement, append, 'condition'); break;
            case 'mqtt':     this.showPropertyItem(condition, list, this.conditionStatement, append, 'condition', true); break;
            case 'state':    this.showStateCondition(condition, list, append); break;
            case 'date':     this.showDateTimeCondition(condition, list, 'date', append); break;
            case 'time':     this.showDateTimeCondition(condition, list, 'time', append); break;
            case 'week':     this.showWeekCondition(condition, list, append); break;
        }
    }

    showAction(action, list, append = false)
    {
        switch (action.type)
        {
            case 'property': this.showPropertyItem(action, list, this.actionStatement, append, 'action'); break;
            case 'mqtt':     this.showMqttAction(action, list, append); break;
            case 'state':    this.showStateAction(action, list, append); break;
            case 'telegram': this.showTelegramAction(action, list, append); break;
            case 'shell':    this.showShellAction(action, list, append); break;
            case 'delay':    this.showDelayAction(action, list, append); break;
        }
    }

    showPropertyItem(item, list, statements, append, type, mqtt)
    {
        fetch('html/automation/propertyItem.html?' + Date.now()).then(response => response.text()).then(html =>
        {
            modal.querySelector('.data').innerHTML = html;
            modal.querySelector('.name').innerHTML = (mqtt ? 'mqtt ' : 'property ') + type;
            modal.querySelector('.item').innerHTML = mqtt ? 'Topic:' : 'Endpoint:';
            modal.querySelector('input[name="item"]').value = mqtt ? item.topic ?? '' : item.endpoint ?? '';
            modal.querySelector('input[name="property"]').value = item.property ?? '';

            statements.forEach(statement =>
            {
                var option = document.createElement('option');

                option.innerHTML = statement;
                modal.querySelector('select[name="statement"]').append(option);

                if (!item.hasOwnProperty(statement))
                    return;

                modal.querySelector('select[name="statement"]').value = statement;

                if (statement == 'between')
                {
                    modal.querySelector('input[name="min"]').value = item[statement][0];
                    modal.querySelector('input[name="max"]').value = item[statement][1];
                }
                else
                    modal.querySelector('input[name="value"]').value = statement != 'updates' ? item[statement] : '';

                this.valueForm(modal, statement);
            });

            modal.querySelector('.triggerName').style.display = type == 'condition' ? 'none' : 'block';
            modal.querySelector('input[name="triggerName"]').value = (type == 'trigger' ? item.name : item.triggerName) ?? '';

            if (!mqtt)
            {
                var services = ['custom', 'zigbee'];
                var exposes = new Object();
                var dropdown = modal.querySelector('.dropdown')

                services.forEach(service =>
                {
                    var status = this.controller[service].status ?? new Object();

                    if (!status.devices)
                        return;

                    status.devices.forEach(device =>
                    {
                        var id;
                        var expose;

                        switch (service)
                        {
                            case 'custom': id = device.id; expose = this.controller.custom.expose[id]; break;
                            case 'zigbee': id = status.names ? device.name : device.ieeeAddress; expose = this.controller.zigbee.expose[id]; break;
                        }

                        if (!expose)
                            return;

                        Object.keys(expose).forEach(key =>
                        {
                            expose[key].items.forEach(item =>
                            {
                                var endpoint = service + '/' + id + (!isNaN(key) ? '/' + key : '');

                                exposeList(item, expose[key].options).forEach(value =>
                                {
                                    if (value == 'switch')
                                        value = 'status';

                                    exposes[device.name + ' &rarr; ' + value +  (!isNaN(key) ? ' ' + key : '')] = new Array(endpoint, value);
                                });
                            });
                        });
                    });
                });

                if (Object.keys(exposes).length)
                {
                    addDropdown(dropdown, Object.keys(exposes), function(item)
                    {
                        modal.querySelector('input[name="item"]').value = exposes[item][0];
                        modal.querySelector('input[name="property"]').value = exposes[item][1];
                        modal.querySelector('input[name="value"]').focus();

                    }.bind(this));

                    dropdown.style.display = 'block';
                }
            }

            modal.querySelector('.save').addEventListener('click', function()
            {
                var data = formData(modal.querySelector('form'));

                statements.forEach(statement => delete item[statement]);

                item[mqtt ? 'topic' : 'endpoint'] = data.item;
                item.property = data.property;
                item[data.statement] = data.statement == 'between' ? [this.parseValue(data.min), this.parseValue(data.max)] : data.statement != 'updates' ? this.parseValue(data.value) : true;

                if (data.triggerName)
                    item[type == 'trigger' ? 'name' : 'triggerName'] = data.triggerName;
                else
                    delete item[type == 'trigger' ? 'name' : 'triggerName'];

                if (append)
                    list.push(item);

                this.showAutomationInfo();

            }.bind(this));

            modal.querySelector('select[name="statement"]').addEventListener('change', function(event) { this.valueForm(modal, event.target.value); }.bind(this));
            modal.querySelector('.cancel').addEventListener('click', function() { showModal(false); });

            modal.removeEventListener('keypress', handleSave);
            modal.addEventListener('keypress', handleSave);
            showModal(true);

            modal.querySelector('input[name="item"]').focus();
        });
    }

    showTelegramTrigger(trigger, append)
    {
        fetch('html/automation/telegramTrigger.html?' + Date.now()).then(response => response.text()).then(html =>
        {
            modal.querySelector('.data').innerHTML = html;
            modal.querySelector('textarea[name="message"]').value = trigger.message ?? '';
            modal.querySelector('input[name="chats"]').value = trigger.chats ? trigger.chats.join(', ') : '';
            modal.querySelector('input[name="name"]').value = trigger.name ?? '';

            modal.querySelector('.save').addEventListener('click', function()
            {
                var data = formData(modal.querySelector('form'));
                var chats = data.chats ? data.chats.split(',').map(item => parseInt(item)).filter(item => !isNaN(item)) : new Array();

                trigger.message = data.message.trim();
                trigger.chats = chats.length ? chats : null;

                if (data.name)
                    trigger.name = data.name;
                else
                    delete trigger.name;

                if (append)
                    this.data.triggers.push(trigger);

                this.showAutomationInfo();

            }.bind(this));

            modal.querySelector('.cancel').addEventListener('click', function() { showModal(false); });

            modal.removeEventListener('keypress', handleSave);
            modal.addEventListener('keypress', handleSave);
            showModal(true);

            modal.querySelector('textarea[name="message"]').focus();
        });
    }

    showTimeTrigger(trigger, append)
    {
        fetch('html/automation/timeTrigger.html?' + Date.now()).then(response => response.text()).then(html =>
        {
            modal.querySelector('.data').innerHTML = html;
            modal.querySelector('input[name="time"]').value = trigger.time ?? '12:00';
            modal.querySelector('input[name="name"]').value = trigger.name ?? '';

            modal.querySelector('.save').addEventListener('click', function()
            {
                var data = formData(modal.querySelector('form'));

                trigger.time = data.time;

                if (data.name)
                    trigger.name = data.name;
                else
                    delete trigger.name;

                if (append)
                    this.data.triggers.push(trigger);

                this.showAutomationInfo();

            }.bind(this));

            modal.querySelector('.cancel').addEventListener('click', function() { showModal(false); });

            modal.removeEventListener('keypress', handleSave);
            modal.addEventListener('keypress', handleSave);
            showModal(true);

            modal.querySelector('input[name="time"]').focus();
        });
    }

    showIntervalTrigger(trigger, append)
    {
        fetch('html/automation/intervalTrigger.html?' + Date.now()).then(response => response.text()).then(html =>
        {
            modal.querySelector('.data').innerHTML = html;
            modal.querySelector('input[name="interval"]').value = trigger.interval ?? '10';
            modal.querySelector('input[name="name"]').value = trigger.name ?? '';

            modal.querySelector('.save').addEventListener('click', function()
            {
                var data = formData(modal.querySelector('form'));

                trigger.interval = parseInt(data.interval);

                if (data.name)
                    trigger.name = data.name;
                else
                    delete trigger.name;

                if (append)
                    this.data.triggers.push(trigger);

                this.showAutomationInfo();

            }.bind(this));

            modal.querySelector('.cancel').addEventListener('click', function() { showModal(false); });

            modal.removeEventListener('keypress', handleSave);
            modal.addEventListener('keypress', handleSave);
            showModal(true);

            modal.querySelector('input[name="interval"]').focus();
        });
    }

    showStateCondition(condition, list, append)
    {
        fetch('html/automation/stateCondition.html?' + Date.now()).then(response => response.text()).then(html =>
        {
            modal.querySelector('.data').innerHTML = html;
            modal.querySelector('input[name="name"]').value = condition.name ?? '';

            this.conditionStatement.forEach(statement =>
            {
                var option = document.createElement('option');

                option.innerHTML = statement;
                modal.querySelector('select[name="statement"]').append(option);

                if (!condition.hasOwnProperty(statement))
                    return;

                    modal.querySelector('select[name="statement"]').value = statement;

                if (statement == 'between')
                {
                    modal.querySelector('input[name="min"]').value = condition[statement][0];
                    modal.querySelector('input[name="max"]').value = condition[statement][1];
                }
                else
                    modal.querySelector('input[name="value"]').value = condition[statement];

                this.valueForm(modal, statement);
            });

            modal.querySelector('.save').addEventListener('click', function()
            {
                var data = formData(modal.querySelector('form'));

                this.conditionStatement.forEach(statement => delete condition[statement]);

                condition.name = data.name;
                condition[data.statement] = data.statement == 'between' ? [this.parseValue(data.min), this.parseValue(data.max)] : this.parseValue(data.value);

                if (append)
                    list.push(condition);

                this.showAutomationInfo();

            }.bind(this));

            modal.querySelector('select[name="statement"]').addEventListener('change', function(event) { this.valueForm(modal, event.target.value); }.bind(this));
            modal.querySelector('.cancel').addEventListener('click', function() { showModal(false); });

            modal.removeEventListener('keypress', handleSave);
            modal.addEventListener('keypress', handleSave);
            showModal(true);

            modal.querySelector('input[name="name"]').focus();
        });
    }

    showDateTimeCondition(condition, list, name, append)
    {
        fetch('html/automation/' + name + 'Condition.html?' + Date.now()).then(response => response.text()).then(html =>
        {
            modal.querySelector('.data').innerHTML = html;

            this.conditionStatement.forEach(statement =>
            {
                var option = document.createElement('option');

                option.innerHTML = statement;
                modal.querySelector('select[name="statement"]').append(option);

                if (!condition.hasOwnProperty(statement))
                    return;

                modal.querySelector('select[name="statement"]').value = statement;

                if (statement == 'between')
                {
                    modal.querySelector('input[name="start"]').value = condition[statement][0];
                    modal.querySelector('input[name="end"]').value = condition[statement][1];
                }
                else
                    modal.querySelector('input[name="value"]').value = condition[statement];

                this.valueForm(modal, statement);
            });

            modal.querySelector('.save').addEventListener('click', function()
            {
                var data = formData(modal.querySelector('form'));

                this.conditionStatement.forEach(statement => delete condition[statement]);
                condition[data.statement] = data.statement == 'between' ? [data.start, data.end] : data.value;

                if (append)
                    list.push(condition);

                this.showAutomationInfo();

            }.bind(this));

            modal.querySelector('select[name="statement"]').addEventListener('change', function(event) { this.valueForm(modal, event.target.value); }.bind(this));
            modal.querySelector('.cancel').addEventListener('click', function() { showModal(false); });

            modal.removeEventListener('keypress', handleSave);
            modal.addEventListener('keypress', handleSave);
            showModal(true);

            modal.querySelector('select[name="statement"]').focus();
        });
    }

    showWeekCondition(condition, list, append)
    {
        fetch('html/automation/weekCondition.html?' + Date.now()).then(response => response.text()).then(html =>
        {
            modal.querySelector('.data').innerHTML = html;
            modal.querySelector('input[name="days"]').value = condition.days ? condition.days.join(', ') : '';

            modal.querySelector('.save').addEventListener('click', function()
            {
                var data = formData(modal.querySelector('form'));
                var days = data.days ? data.days.split(',').map(item => parseInt(item)).filter(item => !isNaN(item)) : new Array();

                condition.days = days.length ? days : null;

                if (append)
                    list.push(condition);

                this.showAutomationInfo();

            }.bind(this));

            modal.querySelector('.cancel').addEventListener('click', function() { showModal(false); });

            modal.removeEventListener('keypress', handleSave);
            modal.addEventListener('keypress', handleSave);
            showModal(true);

            modal.querySelector('input[name="days"]').focus();
        });
    }

    showMqttAction(action, list, append)
    {
        fetch('html/automation/mqttAction.html?' + Date.now()).then(response => response.text()).then(html =>
        {
            modal.querySelector('.data').innerHTML = html;
            modal.querySelector('input[name="topic"]').value = action.topic ?? '';
            modal.querySelector('textarea[name="message"]').value = action.message ?? '';
            modal.querySelector('input[name="triggerName"]').value = action.triggerName ?? '';
            modal.querySelector('input[name="retain"]').checked = action.retain ?? false;

            modal.querySelector('.save').addEventListener('click', function()
            {
                var data = formData(modal.querySelector('form'));

                action.topic = data.topic;
                action.message = data.message.trim();
                action.retain = data.retain;

                if (data.triggerName)
                    action.triggerName = data.triggerName;
                else
                    delete action.triggerName;

                if (append)
                    list.push(action);

                this.showAutomationInfo();

            }.bind(this));

            modal.querySelector('.cancel').addEventListener('click', function() { showModal(false); });

            modal.removeEventListener('keypress', handleSave);
            modal.addEventListener('keypress', handleSave);
            showModal(true);

            modal.querySelector('input[name="topic"]').focus();
        });
    }

    showStateAction(action, list, append)
    {
        fetch('html/automation/stateAction.html?' + Date.now()).then(response => response.text()).then(html =>
        {
            modal.querySelector('.data').innerHTML = html;
            modal.querySelector('input[name="name"]').value = action.name ?? '';
            modal.querySelector('input[name="value"]').value = action.value ?? '';

            modal.querySelector('.save').addEventListener('click', function()
            {
                var data = formData(modal.querySelector('form'));

                action.name = data.name;
                action.value = this.parseValue(data.value);

                if (data.triggerName)
                    action.triggerName = data.triggerName;
                else
                    delete action.triggerName;

                if (append)
                    list.push(action);

                this.showAutomationInfo();

            }.bind(this));

            modal.querySelector('.cancel').addEventListener('click', function() { showModal(false); });

            modal.removeEventListener('keypress', handleSave);
            modal.addEventListener('keypress', handleSave);
            showModal(true);

            modal.querySelector('input[name="name"]').focus();
        });
    }

    showTelegramAction(action, list, append)
    {
        fetch('html/automation/telegramAction.html?' + Date.now()).then(response => response.text()).then(html =>
        {
            modal.querySelector('.data').innerHTML = html;
            modal.querySelector('textarea[name="message"]').value = action.message ?? '';
            modal.querySelector('input[name="chats"]').value = action.chats ? action.chats.join(', ') : '';
            modal.querySelector('input[name="triggerName"]').value = action.triggerName ?? '';
            modal.querySelector('input[name="silent"]').checked = action.silent ?? false;

            modal.querySelector('.save').addEventListener('click', function()
            {
                var data = formData(modal.querySelector('form'));
                var chats = data.chats ? data.chats.split(',').map(item => parseInt(item)).filter(item => !isNaN(item)) : new Array();

                action.message = data.message.trim();
                action.chats = chats.length ? chats : null;
                action.silent = data.silent;

                if (data.triggerName)
                    action.triggerName = data.triggerName;
                else
                    delete action.triggerName;

                if (append)
                    list.push(action);

                this.showAutomationInfo();

            }.bind(this));

            modal.querySelector('.cancel').addEventListener('click', function() { showModal(false); });

            modal.removeEventListener('keypress', handleSave);
            modal.addEventListener('keypress', handleSave);
            showModal(true);

            modal.querySelector('textarea[name="message"]').focus();
        });
    }

    showShellAction(action, list, append)
    {
        fetch('html/automation/shellAction.html?' + Date.now()).then(response => response.text()).then(html =>
        {
            modal.querySelector('.data').innerHTML = html;
            modal.querySelector('input[name="command"]').value = action.command ?? '';
            modal.querySelector('input[name="triggerName"]').value = action.triggerName ?? '';

            modal.querySelector('.save').addEventListener('click', function()
            {
                var data = formData(modal.querySelector('form'));

                action.command = data.command.trim();

                if (data.triggerName)
                    action.triggerName = data.triggerName;
                else
                    delete action.triggerName;

                if (append)
                    list.push(action);

                this.showAutomationInfo();

            }.bind(this));

            modal.querySelector('.cancel').addEventListener('click', function() { showModal(false); });

            modal.removeEventListener('keypress', handleSave);
            modal.addEventListener('keypress', handleSave);
            showModal(true);

            modal.querySelector('input[name="command"]').focus();
        });
    }

    showDelayAction(action, list, append)
    {
        fetch('html/automation/delayAction.html?' + Date.now()).then(response => response.text()).then(html =>
        {
            modal.querySelector('.data').innerHTML = html;
            modal.querySelector('input[name="delay"]').value = action.delay ?? 0;
            modal.querySelector('input[name="triggerName"]').value = action.triggerName ?? '';

            modal.querySelector('.save').addEventListener('click', function()
            {
                var data = formData(modal.querySelector('form'));

                action.delay = parseInt(data.delay);

                if (data.triggerName)
                    action.triggerName = data.triggerName;
                else
                    delete action.triggerName;

                if (append)
                    list.push(action);

                this.showAutomationInfo();

            }.bind(this));

            modal.querySelector('.cancel').addEventListener('click', function() { showModal(false); });

            modal.removeEventListener('keypress', handleSave);
            modal.addEventListener('keypress', handleSave);
            showModal(true);

            modal.querySelector('input[name="delay"]').focus();
        });
    }
}
