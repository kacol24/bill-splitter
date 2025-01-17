import chunk from 'lodash/chunk';
import pad from 'lodash/pad';

export default () => ({
  participant: {},
  addParticipantRow() {
    this.participants.push({
      id: this.participants.length.toString() + Date.now(),
      name: this.participant.name,
      sum: 0
    });
    this.$dispatch('participant-added');
    this.participant = {};
  },
  removeParticipantRow(index) {
    let confirmed = confirm('Remove anggota? Gak bisa di-undo ya');
    if (!confirmed) {
      return;
    }

    let deleted = this.participants.splice(index, 1);
    this.items.forEach(item => {
      const theParticipant = item.participants.findIndex(participant => {
        return participant.id === deleted[0].id;
      });
      if (theParticipant < 0) {
        return;
      }
      item.participants.splice(theParticipant, 1);
    });
    // this.calculateSum();
    this.$dispatch('participant-removed');
  },
  clearParticipants() {
    let confirmed = confirm('Clear anggota? Gak bisa di-undo ya');
    if (!confirmed) {
      return;
    }
    this.participants = [];
    this.items.forEach(item => {
      item.participants = [];
      item.allParticipants = false;
    });
    // this.calculateSum();
    this.$dispatch('participant-cleared');
  },
  shareBill() {
    let messages = [];
    this.participants.forEach((participant, index) => {
      messages.push(this.formatForWhatsapp(index).join('\n'));
      if (index < this.participants.length - 1) {
        messages.push([]);
        messages.push([]);
      }
    });

    return this.constructWhatsappUrl(messages);
  },
  shareParticipant(index) {
    const message = this.formatForWhatsapp(index);

    return this.constructWhatsappUrl(message);
  },
  constructWhatsappUrl(messages) {
    window.open(
        'https://wa.me/?text=' +
        encodeURI('```' + messages.join('\n') + '```'),
        '_blank'
    );
  },
  formatForWhatsapp(index) {
    let participant = this.participants[index];
    const chars = {
      'col': 5,
      'line': 30
    };
    const Col = function(columns, content, align, padding) {
      if (columns === 'auto') {
        return content;
      }

      if (columns === 'full') {
        columns = 6;
      }
      if (typeof align === 'undefined') {
        align = 'left';
      }
      if (typeof padding === 'undefined') {
        padding = chars['col'] * columns;
      }

      if (align === 'left') {
        return String(content).padEnd(padding, ' ');
      }

      if (align === 'right') {
        return String(content).padStart(padding, ' ');
      }

      return pad(content, padding, ' ');
    };
    const Row = function(...cols) {
      let lines = chunk(cols, 3);
      let rows = [];
      lines.forEach(line => {
        let row = [];
        line.forEach(col => row.push(col));

        rows.push(row.join(''));
      });

      return rows;
    };
    const separator = function(numOfChars) {
      if (typeof numOfChars === 'undefined') {
        numOfChars = chars['line'];
      }
      return String('').padStart(numOfChars, '-');
    };

    let message = [];
    message.push(Row(Col('full', participant.name, 'center')));
    message.push(Row(Col('full', separator())));

    participant.items.forEach(item => {
      let itemName = item.name;
      if (item.split !== '1/1') {
        itemName += ` (${item.split})`;
      }
      message.push(
          Row(
              Col(4, itemName),
              Col(2, number_format(item.price), 'right')
          )
      );
    });

    message.push(Row(Col('full', separator(10), 'right')));

    participant.breakdown.forEach(breakdown => {
      message.push(
          Row(
              Col(4, breakdown.key, 'right'),
              Col(2, number_format(breakdown.value), 'right')
          )
      );
    });

    message.push(
        Row(
            Col(4, 'Total', 'right'),
            Col(2, number_format(participant.sum), 'right')
        )
    );
    message.push(Row(Col('full', separator())));

    // console.log('```' + message.join('\n') + '```');
    return message;
  }

});
