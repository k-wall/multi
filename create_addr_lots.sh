#!/bin/bash

NAMESPACE=${1:-enmasse-infra}


for i in {0..7500}
do
/Users/kwall/go/src/github.com/enmasseproject/enmasse/systemtests/scripts/create_address.sh \
${NAMESPACE} \
queue-space \
queue-space.queue-$i \
queue-$i \
queue \
standard-small-queue \
v1beta1

/Users/kwall/go/src/github.com/enmasseproject/enmasse/systemtests/scripts/create_address.sh \
${NAMESPACE} \
queue-space \
queue-space.anycast-$i \
anycast-$i \
anycast \
standard-small-anycast \
v1beta1

done

