document.addEventListener('alpine:init', function() {
  Alpine.data('BillSplitter', function() {
    return {
      init() {
        this.calculateSum();
      },

      // participants
      participants: this.$persist([]),
      selectedParticipantIndex: null,
      get selectedParticipant() {
        return this.participants[this.selectedParticipantIndex];
      },
      getParticipantIndex(item) {
        return item.participants.findIndex(
            participant => participant.id == this.selectedParticipant.id);
      },
      getParticipantCsv(participant) {
        let push = participant.name;
        if (participant.qty > 1) {
          push = push + ` (${participant.qty})`;
        }

        return push;
      },
      calculateSum() {
        this.participants.forEach(participant => {
          participant.sum = 0;
          participant.items = [];
          participant.breakdown = [];
        });
        this.items.forEach(item => {
          const divider = _.sum(_.map(item.participants, 'qty'));
          const price = parseInt(item.price.toString().replaceAll(',', ''));
          const pricePerQty = price / divider;
          item.participants.forEach(itemParticipant => {
            const participantIndex = this.participants.findIndex(
                participant => {
                  return participant.id == itemParticipant.id;
                }
            );
            const pricePerParticipant = pricePerQty * itemParticipant.qty;
            this.participants[participantIndex].items.push({
              'name': item.name,
              'price': pricePerParticipant,
              'split': `${itemParticipant.qty}/${divider}`
            });
            this.participants[participantIndex].sum += pricePerParticipant;
          });
        });
        this.participants.forEach(participant => {
          participant.breakdown.push({
            'key': 'Subtotal',
            'value': participant.sum
          });
          this.charges.forEach(charge => {
            let extra = participant.sum * charge.percent;
            participant.breakdown.push({
              'key': `${charge.name} (${Math.round(charge.percent * 1000) /
              10}%)`,
              'value': extra
            });
            participant.sum += extra;
          });
          participant.sum = Math.ceil(participant.sum);
        });
      },
      get sum() {
        return _.sumBy(this.participants, participant => participant.sum);
      },

      // items
      items: this.$persist([
        {
          price: 0,
          participants: []
        }
      ]),
      get subtotal() {
        return _.sumBy(this.items,
            item => parseInt(item.price.toString().replaceAll(',', '')));
      },
      get grandtotal() {
        let charges = _.sumBy(this.charges,
            charge => parseInt(charge.price.toString().replaceAll(',', '')));

        return this.subtotal + charges;
      },

      // charges
      charges: this.$persist([
        {
          name: '',
          price: 0,
          percent: 0
        }
      ]),
      calculateTaxPercent() {
        this.calculateSum();
        let subtotal = this.subtotal;
        this.charges.forEach((charge) => {
          let price = parseInt(charge.price.toString().replaceAll(',', ''));
          charge.percent = price / subtotal;
          subtotal += price;
        });
      },
      setModal(index) {
        this.selectedParticipantIndex = index;
      },
      addQty(index) {
        if (this.selectedParticipantIndex == null) {
          throw new Error('Harus pilih anggota.');
        }

        let selectedParticipant = this.participants[this.selectedParticipantIndex];
        let participantIndex = this.items[index].participants.findIndex(
            itemParticipant => {
              return itemParticipant.id === selectedParticipant.id;
            }
        );
        if (participantIndex < 0) {
          this.items[index].participants.push({
            id: selectedParticipant.id,
            name: selectedParticipant.name,
            qty: 1
          });
        } else {
          this.items[index].participants[participantIndex].qty++;
        }
        this.$dispatch('qty-changed');
      },
      subQty(index) {
        if (this.selectedParticipantIndex == null) {
          throw new Error('Harus pilih anggota.');
        }

        let selectedParticipant = this.participants[this.selectedParticipantIndex];
        let participantIndex = this.items[index].participants.findIndex(
            itemParticipant => {
              return itemParticipant.id === selectedParticipant.id;
            }
        );
        if (participantIndex < 0) {
          return;
        }

        if (this.items[index].participants[participantIndex].qty <= 0) {
          return;
        }

        this.items[index].participants[participantIndex].qty--;

        if (this.items[index].participants[participantIndex].qty <= 0) {
          this.items[index].participants.splice(participantIndex, 1);
        }

        this.$dispatch('qty-changed');
      }
    };
  });

  Alpine.data('ParticipantList', function() {
    return {
      participant: {},
      addParticipantRow() {
        this.participants.push({
          id: this.participants.length.toString() + Date.now(),
          name: this.participant.name,
          sum: 0
        });
        // let ref = 'participant-' + this.participants.length;
        // this.$nextTick(() => {
        //   let inputEl = document.querySelectorAll('[x-ref="' + ref + '"]');
        //   inputEl[0].focus();
        // });
        // this.calculateSum();
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
            return participant.id == deleted[0].id;
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
        const Col = function(columns, content, align, pad) {
          if (columns === 'auto') {
            return content;
          }

          if (columns === 'full') {
            columns = 6;
          }
          if (typeof align === 'undefined') {
            align = 'left';
          }
          if (typeof pad === 'undefined') {
            pad = chars['col'] * columns;
          }

          if (align === 'left') {
            return String(content).padEnd(pad, ' ');
          }

          if (align === 'right') {
            return String(content).padStart(pad, ' ');
          }

          return _.pad(content, pad, ' ');
        };
        const Row = function(...cols) {
          let lines = _.chunk(cols, 3);
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
    };
  });

  Alpine.data('ItemList', function() {
    return {
      addItemRow() {
        this.items.push({
          price: 0,
          participants: []
        });
        let ref = 'item-' + this.items.length;
        this.$nextTick(() => {
          let inputEl = document.querySelectorAll('[x-ref="' + ref + '"]');
          inputEl[0].focus();
        });
        this.$dispatch('item-added');
      },
      removeItemRow(index) {
        let confirmed = confirm('Remove item? Gak bisa di-undo ya');
        if (!confirmed) {
          return;
        }
        this.items.splice(index, 1);
        // this.calculateSum();
        // this.calculateTaxPercent();
        this.$dispatch('item-removed');
      },
      toggleParticipants(index, checked) {
        if (checked) {
          this.items[index].participants = _.map(this.participants, 'id');
        } else {
          this.items[index].participants = [];
        }
        // this.calculateSum();
        this.$dispatch('participant-toggled');
      },
      clearBill() {
        let confirmed = confirm('Clear bill? Gak bisa di-undo ya');
        if (!confirmed) {
          return;
        }
        this.items = [];
        this.charges = [];
        // this.calculateSum();
        this.$dispatch('bill-cleared');
        this.charges = [
          {
            name: '',
            price: 0,
            percent: 0
          }
        ];
      }
    };
  });

  Alpine.data('ChargesList', function() {
    return {
      addChargeRow() {
        this.charges.push(
            {
              name: '',
              price: 0,
              percent: 0
            }
        );
      },
      removeChargeRow(index) {
        this.charges.splice(index, 1);
        // this.calculateSum();
        this.$dispatch('charge-removed');
      }
    };
  });
});
